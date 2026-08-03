import { useEffect, useState } from 'react'
import { serviceMonitor, type ServiceStatus as ServiceStatusInfo } from '@/lib/serviceMonitor'

export function ServiceStatus() {
  const [statuses, setStatuses] = useState<ServiceStatusInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkServices = async () => {
      try {
        const results = await serviceMonitor.checkAllServices()
        setStatuses(results)
      } catch (error) {
        console.error('Failed to check services:', error)
      } finally {
        setLoading(false)
      }
    }

    checkServices()
    // Recheck every 30 seconds
    const interval = setInterval(checkServices, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">Checking service connectivity...</p>
      </div>
    )
  }

  const healthyCount = statuses.filter(s => s.healthy).length
  const totalCount = statuses.length
  const allHealthy = healthyCount === totalCount

  return (
    <div className={`border rounded-lg p-4 ${allHealthy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${allHealthy ? 'text-green-800' : 'text-yellow-800'}`}>
          Services Status: {healthyCount}/{totalCount} Online
        </h3>
        <button
          onClick={() => serviceMonitor.checkAllServices().then(setStatuses)}
          className="text-xs px-2 py-1 rounded bg-white hover:bg-gray-100 border"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        {statuses.map((status) => (
          <div
            key={status.name}
            className={`p-2 rounded flex items-start gap-2 ${
              status.healthy
                ? 'bg-green-100 border border-green-300'
                : 'bg-red-100 border border-red-300'
            }`}
          >
            <span className={`font-bold ${status.healthy ? 'text-green-700' : 'text-red-700'}`}>
              {status.healthy ? '✓' : '✗'}
            </span>
            <div className="flex-1">
              <div className={`font-medium ${status.healthy ? 'text-green-800' : 'text-red-800'}`}>
                {status.name}
              </div>
              {status.healthy && (
                <div className="text-xs text-gray-600">
                  {status.responseTime.toFixed(0)}ms
                </div>
              )}
              {!status.healthy && status.error && (
                <div className="text-xs text-red-700">
                  {status.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
