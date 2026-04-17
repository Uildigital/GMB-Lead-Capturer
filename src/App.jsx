import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Search, MapPin, Globe, Star, Users, Briefcase, Plus, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Inicialização do Supabase usando variáveis de ambiente (Seguro para Produção)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// URL do n8n Webhook (Configurável via ENV)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [scrapingProgress, setScrapingProgress] = useState(false)
  const [filters, setFilters] = useState({
    niche: '',
    city: '',
    state: '',
    region: ''
  })

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
          setLeads((currentLeads) => [payload.new, ...currentLeads])
          // Se o robô estava rodando, podemos liberar o botão
          setScrapingProgress(false)
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
                placeholder="Ex: Confeitaria, Dentista..."
                value={filters.niche}
                onChange={e => setFilters({...filters, niche: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Cidade</label>
              <input 
                placeholder="Ex: São Paulo"
                value={filters.city}
                onChange={e => setFilters({...filters, city: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Estado</label>
              <input 
                placeholder="Ex: SP"
                value={filters.state}
                onChange={e => setFilters({...filters, state: e.target.value})}
                required
              />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Leads Recentes <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({leads.length})</span></h2>
          <button onClick={fetchLeads} className="glass" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Atualizar Lista</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Carregando leads do banco...</p>
          </div>
        ) : (
          <div className="leads-grid">
            <AnimatePresence>
              {leads.map((lead) => (
                <motion.div 
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass lead-card"
                >
                  <div className="lead-header">
                    <span className="lead-name">{lead.company_name}</span>
                    {lead.has_website ? (
                      <span className="badge badge-success">Com Site</span>
                    ) : (
                      <span className="badge badge-danger">Sem Site ⚠️</span>
                    )}
                  </div>

                  <div className="rating-bar">
                    <div className="star-rating"><Star size={14} fill="currentColor" /> {lead.rating || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {lead.reviews_count || 0} avaliações
                    </div>
                  </div>

                  <div className="lead-info">
                    <MapPin size={14} />
                    <span>{lead.city}, {lead.state}</span>
                    {lead.website && (
                      <>
                        <Globe size={14} />
                        <a href={lead.website} target="_blank" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Ver Website</a>
                      </>
                    )}
                    <AlertCircle size={14} />
                    <span>Nicho: {lead.niche}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
