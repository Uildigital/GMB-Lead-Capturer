import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Search, MapPin, Globe, Star, Users, Briefcase, Plus, Loader2, AlertCircle, MessageCircle, Instagram, Facebook, Link as LinkIcon, Filter, Phone } from 'lucide-react'
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

// Função Auxiliar para cores de pontuação
const getScoreColor = (score) => {
  if (score >= 80) return '#ef4444'; // Vermelho (Alta Oportunidade/Problema grave)
  if (score >= 50) return '#f59e0b'; // Laranja (Média Oportunidade)
  return '#10b981'; // Verde (Saudável/Baixa Oportunidade)
}

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [scrapingProgress, setScrapingProgress] = useState(false)
  const [statesList, setStatesList] = useState([])
  const [citiesList, setCitiesList] = useState([])
  const [expandedLead, setExpandedLead] = useState(null)
  
  // Lista de Nichos pré-definidos
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
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [nicheFilter, setNicheFilter] = useState('Todos')

  const uniqueNichesInDatabase = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      const n = l.niche?.trim() || 'Não Classificado';
      counts[n] = (counts[n] || 0) + 1;
    });
    
    return Object.keys(counts).sort().map(name => ({
      name: name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      count: counts[name]
    }));
  }, [leads])

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStatesList(data))
  }, [])

  useEffect(() => {
    if (filters.state) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filters.state}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then(data => setCitiesList(data))
    } else {
      setCitiesList([])
    }
  }, [filters.state])

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gmb_leads')
      .select('*')
      .order('total_score', { ascending: false }) // Ordena por prioridade automática
    
    if (data) setLeads(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gmb_leads' }, (payload) => {
        setLeads((currentLeads) => [payload.new, ...currentLeads])
        setScrapingProgress(false)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gmb_leads' }, (payload) => {
        setLeads((currentLeads) => currentLeads.map(lead => lead.id === payload.new.id ? payload.new : lead))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
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
      if (response.ok) setScrapingProgress(true) 
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const updateLeadStatus = async (id, newStatus) => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead))
    await supabase.from('gmb_leads').update({ status: newStatus }).eq('id', id)
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchSearch = lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.niche?.toLowerCase().includes(searchTerm.toLowerCase());
      const leadStatus = lead.status || 'Novo';
      const matchStatus = statusFilter === 'Todos' ? leadStatus !== 'Descartado' : leadStatus === statusFilter;
      const currentNiche = lead.niche?.trim() || 'Não Classificado';
      const matchNiche = nicheFilter === 'Todos' || currentNiche === nicheFilter;
      return matchSearch && matchStatus && matchNiche;
    });
  }, [leads, searchTerm, statusFilter, nicheFilter])

  return (
    <div className="container">
      <header>
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
        >
          <img src="https://fav.farm/🚀" alt="logo" style={{ width: '40px' }} />
          <h1>GMB Lead Capturer <span className="badge-pro">PRO</span></h1>
        </motion.div>
        <p className="subtitle">Ranking Estratégico & Inteligência Artificial para Prospecção Local.</p>
      </header>

      <motion.div className="glass search-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <form onSubmit={handleCapture}>
          <div className="form-grid">
            <div className="input-group">
              <label><Briefcase size={14} /> Nicho Alvo</label>
              <input list="niches-suggestions" placeholder="Ex: Dentista..." value={filters.niche} onChange={e => setFilters({...filters, niche: e.target.value})} required />
              <datalist id="niches-suggestions">{nichesList.map(n => <option key={n} value={n} />)}</datalist>
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Estado</label>
              <select value={filters.state} onChange={e => setFilters({ ...filters, state: e.target.value, city: '' })} required>
                <option value="">Selecione o Estado</option>
                {statesList.map(uf => (<option key={uf.id} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>))}
              </select>
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Cidade</label>
              <select value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} required disabled={!filters.state}>
                <option value="">Selecione a Cidade</option>
                {citiesList.map(c => (<option key={c.nome} value={c.nome}>{c.nome}</option>))}
              </select>
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Região Específica</label>
              <input placeholder="Ex: Centro..." value={filters.region} onChange={e => setFilters({...filters, region: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="primary" disabled={searching || scrapingProgress}>
            {searching ? <><Loader2 className="loading-spinner" /> Conectando...</> : scrapingProgress ? <><Loader2 className="loading-spinner" /> Capturando com IA...</> : <><Plus size={18} /> Iniciar Prospecção</>}
          </button>
        </form>
      </motion.div>

      <section>
        <div className="action-bar">
          <h2>Base de Oportunidades <span className="counter">({filteredLeads.length})</span></h2>
          <div className="filters-row">
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select value={nicheFilter} onChange={e => setNicheFilter(e.target.value)}>
              <option value="Todos">Todos Nichos</option>
              {uniqueNichesInDatabase.map(n => (<option key={n.name} value={n.name}>{n.displayName}</option>))}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="Todos">Sem Descartados</option>
              <option value="Novo">✨ Novo</option>
              <option value="Em Contato">💬 Contato</option>
              <option value="Agendado">📅 Agendado</option>
              <option value="Fechado">✅ Cliente</option>
              <option value="Descartado">❌ Descartado</option>
            </select>
          </div>
        </div>

        <div className="leads-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
          <AnimatePresence>
            {filteredLeads.map((lead) => (
              <motion.div 
                key={lead.id} 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`glass lead-card ${lead.priority === 'Urgente' ? 'priority-urgent' : ''}`}
              >
                <div className="lead-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="lead-name">{lead.company_name}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`priority-badge ${lead.priority?.toLowerCase()}`}>
                        {lead.priority || 'Baixa'}
                      </span>
                      {lead.is_claimed === false && <span className="danger-badge">Não Reivindicado</span>}
                    </div>
                  </div>
                  <select 
                    value={lead.status || 'Novo'} 
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="Novo">✨ Novo</option>
                    <option value="Em Contato">💬 Contato</option>
                    <option value="Agendado">📅 Reunião</option>
                    <option value="Fechado">✅ Fechado</option>
                    <option value="Descartado">❌ Descartar</option>
                  </select>
                </div>

                <div className="score-summary">
                  <div className="score-item" title="Otimização GMB">
                    <span>GMB</span>
                    <div className="score-bar"><div className="fill" style={{ width: `${lead.gmb_score}%`, background: getScoreColor(lead.gmb_score) }} /></div>
                  </div>
                  <div className="score-item" title="Qualidade do Site">
                    <span>Web</span>
                    <div className="score-bar"><div className="fill" style={{ width: `${lead.web_score}%`, background: getScoreColor(lead.web_score) }} /></div>
                  </div>
                  <div className="score-item" title="Redes Sociais">
                    <span>Social</span>
                    <div className="score-bar"><div className="fill" style={{ width: `${lead.social_score || 0}%`, background: getScoreColor(lead.social_score || 0) }} /></div>
                  </div>
                  <div className="total-lead-score">
                    <strong>{lead.total_score || 0}</strong>
                    <span>pts</span>
                  </div>
                </div>

                <div className="lead-contacts">
                  <div className="contact-row"><Phone size={14} /> <span>{lead.phone || 'Sem Telefone'}</span></div>
                  <div className="contact-row"><MapPin size={14} /> <span>{lead.city} - {lead.state}</span></div>
                  <div className="social-links-row">
                    {lead.website ? (
                      <a href={lead.website} target="_blank" className="link-tag site">
                        <Globe size={14} /> {lead.is_business_site ? 'Google Site' : 'Site Próprio'}
                      </a>
                    ) : <span className="link-tag none"><AlertCircle size={14} /> Sem Site</span>}
                    
                    {lead.instagram_url && (
                      <a href={lead.instagram_url} target="_blank" className="link-tag insta">
                        <Instagram size={14} /> Instagram
                      </a>
                    )}
                    {lead.google_url && (
                      <a href={lead.google_url} target="_blank" className="link-tag gmaps">
                        <MapPin size={14} /> Maps
                      </a>
                    )}
                  </div>
                </div>

                {lead.ai_diagnosis && (
                  <div className="ai-analysis-box">
                    <div className="ai-header">
                      <div className="ai-title"><Loader2 size={14} /> Análise Estratégica IA</div>
                      <span className="recommendation-badge">{lead.ai_recommendation}</span>
                    </div>
                    <p className="ai-diagnosis">"{lead.ai_diagnosis}"</p>
                    <button 
                      className="btn-pitch" 
                      onClick={() => {
                        setExpandedLead(expandedLead === lead.id ? null : lead.id)
                      }}
                    >
                      {expandedLead === lead.id ? 'Fechar Pitch' : '💡 Ver Script de Abordagem'}
                    </button>
                    {expandedLead === lead.id && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pitch-content">
                        <strong>Script Sugerido:</strong>
                        <p>{lead.ai_pitch}</p>
                        <button 
                          className="copy-btn"
                          onClick={() => navigator.clipboard.writeText(lead.ai_pitch)}
                        > Copiar Script </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}

export default App
