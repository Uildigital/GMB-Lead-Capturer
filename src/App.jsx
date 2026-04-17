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
  const [filters, setFilters] = useState({
    niche: '',
    city: '',
    state: '',
    region: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gmb_leads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setLeads(data)
    setLoading(false)
  }

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
        // O n8n vai processar em background e gravar no Supabase
        // Podemos dar um pequeno delay e atualizar
        setTimeout(fetchLeads, 10000) // 10s para dar tempo do scraper rodar
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
          
          <button type="submit" className="primary" disabled={searching}>
            {searching ? (
              <>
                <div className="loading-spinner" /> Capturando Leads...
              </>
            ) : (
              <>
                <Plus size={18} /> Iniciar Nova Captura
              </>
            )}
          </button>
        </form>
      </motion.div>

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
