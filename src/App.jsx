import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Search, MapPin, Globe, Star, Users, Briefcase, Plus, Loader2, AlertCircle, MessageCircle, Instagram, Facebook, Link as LinkIcon, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Inicialização do Supabase usando variáveis de ambiente (Seguro para Produção)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// URL do n8n Webhook (Configurável via ENV)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL

// Função Auxiliar para classificar o tipo de link
const getLinkInfo = (url) => {
  if (!url) return { type: 'Nenhum', icon: <Globe size={14} />, color: 'var(--text-muted)' };
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('whatsapp.com') || lowerUrl.includes('wa.me')) return { type: 'WhatsApp', icon: <MessageCircle size={14} />, color: '#25D366' };
  if (lowerUrl.includes('instagram.com')) return { type: 'Instagram', icon: <Instagram size={14} />, color: '#E1306C' };
  if (lowerUrl.includes('facebook.com')) return { type: 'Facebook', icon: <Facebook size={14} />, color: '#1877F2' };
  if (lowerUrl.includes('linktr.ee')) return { type: 'Linktree', icon: <LinkIcon size={14} />, color: '#39E09B' };
  return { type: 'Site Externo', icon: <Globe size={14} />, color: 'var(--primary)' };
}

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [scrapingProgress, setScrapingProgress] = useState(false)
  const [statesList, setStatesList] = useState([])
  const [citiesList, setCitiesList] = useState([])
  
  // Lista de Nichos pré-definidos para facilitar a busca
  const nichesList = [
    "Psicólogo", "Dentista", "Pizzaria", "Hamburgueria", "Clínica de Estética", 
    "Advogado", "Contador", "Oficina Mecânica", "Pet Shop", "Academia", 
    "Confeitaria", "Salão de Beleza", "Imobiliária", "Arquitetura", "Fisioterapia"
  ].sort()

  const [filters, setFilters] = useState({
    niche: '',
    city: '',
    state: '',
    region: ''
  })
  
  // Estados para o mini-CRM (Filtros locais da lista)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [nicheFilter, setNicheFilter] = useState('Todos')

  // Gera uma lista de nichos únicos com contador, baseada nos leads do banco
  const uniqueNichesInDatabase = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      const n = l.niche?.trim() || 'Não Classificado';
      counts[n] = (counts[n] || 0) + 1;
    });
    
    // Retorna array de objetos { name, count }
    const sortedNiches = Object.keys(counts).sort().map(name => ({
      name,
      count: counts[name]
    }));

    return sortedNiches;
  }, [leads])

  // Carrega os estados do IBGE ao iniciar
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStatesList(data))
      .catch(err => console.error("Erro ao buscar estados:", err))
  }, [])

  // Carrega as cidades quando um estado é selecionado
  useEffect(() => {
    if (filters.state) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filters.state}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then(data => setCitiesList(data))
        .catch(err => console.error("Erro ao buscar cidades:", err))
    } else {
      setCitiesList([])
    }
  }, [filters.state])

  // Função para buscar leads iniciais
  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gmb_leads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setLeads(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()

    // --- MÁGICA DO REALTIME ---
    // Inscreve no canal de mudanças da tabela gmb_leads
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Escuta apenas novas inserções
          schema: 'public',
          table: 'gmb_leads',
        },
        (payload) => {
          console.log('Novo lead detectado em tempo real!', payload.new)
          // Adiciona o novo lead no topo da lista instantaneamente
          setLeads((currentLeads) => [{...payload.new, status: payload.new.status || 'Novo'}, ...currentLeads])
          // Se o robô estava rodando, podemos liberar o botão
          setScrapingProgress(false)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'gmb_leads' },
        (payload) => {
          setLeads((currentLeads) => currentLeads.map(lead => lead.id === payload.new.id ? payload.new : lead))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleCapture = async (e) => {
    e.preventDefault()
    setSearching(true)
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })

      if (response.ok) {
        // O Webhook do n8n responde imediatamente, e o scraping rola em background
        setScrapingProgress(true) 
      }
    } catch (err) {
      console.error('Erro ao chamar n8n:', err)
    } finally {
      setSearching(false)
    }
  }

  const updateLeadStatus = async (id, newStatus) => {
    // Atualização otimista na UI (antes mesmo de salvar no banco) para ficar super rápido
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead))
    
    // Atualiza no Supabase
    const { error } = await supabase
      .from('gmb_leads')
      .update({ status: newStatus })
      .eq('id', id)
      
    if (error) {
      console.error("Erro ao atualizar status:", error)
      fetchLeads() // Reverte se der erro
    }
  }

  const updateLeadNiche = async (id, newNiche) => {
    // Atualização otimista
    setLeads(leads.map(lead => lead.id === id ? { ...lead, niche: newNiche } : lead))
    
    // Atualiza no Supabase
    const { error } = await supabase
      .from('gmb_leads')
      .update({ niche: newNiche })
      .eq('id', id)
      
    if (error) {
      console.error("Erro ao atualizar nicho:", error)
      fetchLeads()
    }
  }

  // Filtragem dos Leads na view (Pesquisa e Status)
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchSearch = lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.niche?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || (lead.status || 'Novo') === statusFilter;
      const currentNiche = lead.niche?.trim() || 'Não Classificado';
      const matchNiche = nicheFilter === 'Todos' || currentNiche === nicheFilter;
      return matchSearch && matchStatus && matchNiche;
    });
  }, [leads, searchTerm, statusFilter, nicheFilter])

  return (
    <div className="container">
      <header>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          GMB Lead Capturer
        </motion.h1>
        <p className="subtitle">Encontre empresas com perfis do Google Maps que precisam do seu serviço.</p>
      </header>

      <motion.div 
        className="glass search-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <form onSubmit={handleCapture}>
          <div className="form-grid">
            <div className="input-group">
              <label><Briefcase size={14} /> Nicho</label>
              <input 
                list="niches-suggestions"
                placeholder="Ex: Psicólogo, Pizzaria..."
                value={filters.niche}
                onChange={e => setFilters({...filters, niche: e.target.value})}
                required
              />
              <datalist id="niches-suggestions">
                {nichesList.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Estado</label>
              <select 
                value={filters.state}
                onChange={e => setFilters({ ...filters, state: e.target.value, city: '' })}
                required
              >
                <option value="">Selecione o Estado</option>
                {statesList.map(uf => (
                  <option key={uf.id} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Cidade</label>
              <select 
                value={filters.city}
                onChange={e => setFilters({...filters, city: e.target.value})}
                required
                disabled={!filters.state || citiesList.length === 0}
              >
                <option value="">{filters.state ? "Selecione a Cidade" : "Selecione o Estado primeiro"}</option>
                {citiesList.map(city => (
                  <option key={city.id} value={city.nome}>{city.nome}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" className="primary" disabled={searching || scrapingProgress}>
            {searching ? (
              <>
                <div className="loading-spinner" /> Conectando ao n8n...
              </>
            ) : scrapingProgress ? (
              <>
                <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }} /> 
                Robô buscando... (Pode levar até 5 min)
              </>
            ) : (
              <>
                <Plus size={18} /> Iniciar Nova Captura
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Alerta Invisível de Teste de Fundo */}
      <AnimatePresence>
        {scrapingProgress && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <Loader2 className="loading-spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
              <strong>A busca está rodando em segundo plano.</strong> Fique à vontade para navegar. Novos resultados aparecerão sozinhos na tabela abaixo assim que o Apify terminar de varrer o Google.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <h2>Base de Leads <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({filteredLeads.length})</span></h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou nicho..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '200px' }}
              />
            </div>
            
            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                value={nicheFilter} 
                onChange={e => setNicheFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <option value="Todos">Todos os Nichos ({leads.length})</option>
                {uniqueNichesInDatabase.map(n => (
                  <option key={n.name} value={n.name}>{n.name} ({n.count})</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Novo">Novo</option>
                <option value="Em Contato">Em Contato</option>
                <option value="Agendado">Reunião Agendada</option>
                <option value="Fechado">Cliente Fechado</option>
                <option value="Descartado">Descartado</option>
              </select>
            </div>

            <button onClick={fetchLeads} className="glass" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Atualizar</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Carregando leads do banco...</p>
          </div>
        ) : (
          <div className="leads-grid">
            <AnimatePresence>
              {filteredLeads.map((lead) => {
                const linkInfo = getLinkInfo(lead.website);
                return (
                  <motion.div 
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass lead-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    <div className="lead-header">
                      <span className="lead-name">{lead.company_name}</span>
                      <select 
                        value={lead.status || 'Novo'} 
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '0.8rem', 
                          borderRadius: '1rem', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: lead.status === 'Fechado' ? 'rgba(37, 211, 102, 0.2)' : 
                                      lead.status === 'Descartado' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: 'var(--text)'
                        }}
                      >
                        <option value="Novo">✨ Novo</option>
                        <option value="Em Contato">💬 Em Contato</option>
                        <option value="Agendado">📅 Agendado</option>
                        <option value="Fechado">✅ Fechado</option>
                        <option value="Descartado">❌ Descartado</option>
                      </select>
                    </div>

                    <div className="rating-bar">
                      <div className="star-rating"><Star size={14} fill="currentColor" /> {lead.rating || 'N/A'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} /> {lead.reviews_count || 0} avaliações
                      </div>
                    </div>

                    <div className="lead-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '4px' }}>
                        <Briefcase size={14} style={{ flexShrink: 0 }} />
                        <input 
                          list="niches-suggestions"
                          defaultValue={lead.niche}
                          onBlur={(e) => {
                            if (e.target.value !== lead.niche) {
                              updateLeadNiche(lead.id, e.target.value)
                            }
                          }}
                          placeholder="Classificar nicho..."
                          style={{ 
                            border: 'none', 
                            background: 'rgba(255,255,255,0.05)', 
                            fontSize: '0.85rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            color: 'var(--primary)',
                            fontWeight: '600',
                            width: '100%'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} />
                        <span>{lead.city}, {lead.state}</span>
                      </div>
                      
                      {lead.website && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ color: linkInfo.color }}>{linkInfo.icon}</span>
                          <a href={lead.website} target="_blank" style={{ color: linkInfo.color, textDecoration: 'none', fontWeight: '500' }}>
                            {linkInfo.type}
                          </a>
                        </div>
                      )}
                      
                      {!lead.website && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--danger)' }}>
                          <AlertCircle size={14} /> <span>Sem Presença Digital</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
