import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Play, RefreshCw, Server } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ServiceStatus } from '@/components/ui/ServiceStatus'
import { api } from '@/lib/api'

interface PresetRequest {
  id: string
  label: string
  service: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: string
  description: string
}

const PRESETS: PresetRequest[] = [
  {
    id: 'auth-me',
    label: 'Auth — Mon profil',
    service: 'auth-service',
    method: 'GET',
    path: '/auth/me',
    description: "Vérifie que la gateway transmet bien le token vers l'auth-service et qu'il répond.",
  },
  {
    id: 'academic-faculties',
    label: 'Académique — Facultés',
    service: 'academic-service',
    method: 'GET',
    path: '/academic/faculties/',
    description: 'Liste les facultés via /api/academic (gateway → academic-service).',
  },
  {
    id: 'academic-courses',
    label: 'Académique — Cours',
    service: 'academic-service',
    method: 'GET',
    path: '/academic/courses/',
    description: 'Liste les cours enregistrés dans le service académique.',
  },
  {
    id: 'finance-create-student-ref',
    label: 'Finance — Créer une référence étudiant',
    service: 'finance-service',
    method: 'POST',
    path: '/finance/student-ref',
    body: JSON.stringify({ id_student: 999, id_person: 999, matricule: 'DIAG-999', nom_complet_cache: 'Etudiant Diagnostic' }, null, 2),
    description: 'Requête en écriture : vérifie que le corps JSON traverse bien la gateway (POST body forwarding).',
  },
  {
    id: 'marketing-campaigns',
    label: 'Marketing — Campagnes',
    service: 'finance-service',
    method: 'GET',
    path: '/marketing/campaigns',
    description: 'Liste les campagnes marketing (même service que Finance, préfixe /api/marketing).',
  },
  {
    id: 'hr-employees',
    label: 'RH — Employés',
    service: 'hr-service',
    method: 'GET',
    path: '/hr/employees/',
    description: "Liste les employés via /api/hr (réécrit en /api/v1/hr côté gateway).",
  },
]

interface ResultState {
  status: number | null
  latencyMs: number
  ok: boolean
  body: string
  error?: string
}

export function DiagnosticsPage() {
  const [selectedId, setSelectedId] = useState(PRESETS[0].id)
  const [method, setMethod] = useState<PresetRequest['method']>(PRESETS[0].method)
  const [path, setPath] = useState(PRESETS[0].path)
  const [body, setBody] = useState(PRESETS[0].body || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)

  const handlePresetChange = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    setSelectedId(id)
    setMethod(preset.method)
    setPath(preset.path)
    setBody(preset.body || '')
    setResult(null)
  }

  const handleSend = async () => {
    setLoading(true)
    setResult(null)
    const start = performance.now()
    try {
      let data: unknown
      if (method === 'GET') {
        data = await api.get(path)
      } else if (method === 'DELETE') {
        data = await api.delete(path)
      } else {
        const parsedBody = body.trim() ? JSON.parse(body) : {}
        data = method === 'POST'
          ? await api.post(path, parsedBody)
          : method === 'PUT'
            ? await api.put(path, parsedBody)
            : await api.patch(path, parsedBody)
      }
      setResult({
        status: 200,
        latencyMs: Math.round(performance.now() - start),
        ok: true,
        body: JSON.stringify(data, null, 2),
      })
    } catch (err: any) {
      setResult({
        status: err?.status ?? null,
        latencyMs: Math.round(performance.now() - start),
        ok: false,
        body: '',
        error: err?.message || 'Erreur inconnue',
      })
    } finally {
      setLoading(false)
    }
  }

  const currentPreset = PRESETS.find((p) => p.id === selectedId)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Diagnostics API</h1>
          <p>Vérifie en direct la communication Frontend → API Gateway → Microservices.</p>
        </div>
      </div>

      {/* Service health overview */}
      <div className="page-section">
        <h2 className="section-title flex items-center gap-2">
          <Server className="h-4 w-4" /> État des services
        </h2>
        <ServiceStatus />
      </div>

      {/* Request tester */}
      <div className="page-section">
        <h2 className="section-title flex items-center gap-2">
          <Activity className="h-4 w-4" /> Testeur de requêtes
        </h2>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Requête prédéfinie</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={selectedId}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              {currentPreset && (
                <p className="text-xs text-gray-500 mt-1">{currentPreset.description}</p>
              )}
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Méthode</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PresetRequest['method'])}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Chemin (via gateway, ex: /academic/faculties/)</label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
            </div>
          </div>

          {method !== 'GET' && method !== 'DELETE' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Corps JSON</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono h-32"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleSend} isLoading={loading} leftIcon={<Play className="h-4 w-4" />}>
            Envoyer la requête
          </Button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {result.ok ? (
                    <StatusBadge status="success" label="Succès" />
                  ) : (
                    <StatusBadge status="error" label={result.status ? `Erreur ${result.status}` : 'Erreur réseau'} />
                  )}
                  <span className="text-xs text-gray-500">{result.latencyMs} ms</span>
                </div>
              </div>
              <pre className="p-4 text-xs overflow-auto max-h-96 bg-gray-900 text-gray-100">
                {result.ok ? result.body : result.error}
              </pre>
            </motion.div>
          )}
        </div>
      </div>

      {/* Procedure reminder */}
      <div className="page-section">
        <h2 className="section-title flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Procédure de vérification manuelle
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 text-sm text-gray-700 space-y-2">
          <p>1. <code>docker compose up --build</code> à la racine du projet.</p>
          <p>2. Attendre que tous les conteneurs soient <code>healthy</code> : <code>docker compose ps</code>.</p>
          <p>3. Lancer le script de seed : <code>./scripts/seed-test-data.sh</code> (voir le README).</p>
          <p>4. Se connecter avec l'un des comptes de test (voir la page de connexion).</p>
          <p>5. Utiliser cette page pour envoyer des requêtes vers chaque microservice via la gateway et confirmer les réponses.</p>
        </div>
      </div>
    </div>
  )
}
