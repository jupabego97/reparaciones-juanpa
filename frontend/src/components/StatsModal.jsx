import React from 'react'
import { X, BarChart3, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react'
import moment from 'moment'

const StatsModal = ({ isOpen, onClose, stats, repairs }) => {
  if (!isOpen) return null

  const safeStats = stats || {}
  const totalRepairs = repairs?.length || 0
  const completedRepairs = repairs?.filter((r) => r.status === 'listos').length || 0
  const completionRate = totalRepairs > 0 ? ((completedRepairs / totalRepairs) * 100).toFixed(1) : 0

  // Reparaciones por mes (últimos 6 meses)
  const monthlyStats = {}
  const last6Months = []
  for (let i = 5; i >= 0; i--) {
    const month = moment().subtract(i, 'months').format('YYYY-MM')
    const monthName = moment().subtract(i, 'months').format('MMM YYYY')
    last6Months.push({ key: month, name: monthName })
    monthlyStats[month] = 0
  }

  repairs?.forEach(repair => {
    const month = moment(repair.createdAt).format('YYYY-MM')
    if (monthlyStats.hasOwnProperty(month)) {
      monthlyStats[month]++
    }
  })

  const maxMonthlyCount = Math.max(...Object.values(monthlyStats), 1)

  // Reparaciones urgentes
  const urgentRepairs = repairs?.filter(r => 
    r.isOverdue || r.isDueSoon || r.priority === 'high'
  )

  // Ingresos totales
  const totalRevenue = safeStats.totalRevenue ?? safeStats.total_revenue ?? 0
  const averageRevenue = totalRepairs > 0 ? (totalRevenue / totalRepairs) : 0

  const byStatus = safeStats.byStatus || safeStats.by_status || {}
  const overdue = safeStats.overdue ?? safeStats.overdueCount ?? 0
  const dueSoon = safeStats.dueSoon ?? safeStats.due_soon ?? 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>Estadísticas del Taller</span>
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Reparaciones</p>
                  <p className="text-3xl font-bold">{totalRepairs}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Tasa de Finalización</p>
                  <p className="text-3xl font-bold">{completionRate}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Urgentes</p>
                  <p className="text-3xl font-bold">{overdue + dueSoon}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Ingresos Totales</p>
                  <p className="text-2xl font-bold">${Number(totalRevenue).toLocaleString('es-CO')}</p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-200" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distribución por estado */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Distribución por Estado
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'ingresado', name: 'Ingresado', color: 'bg-blue-500', textColor: 'text-blue-700' },
                  { key: 'diagnosticada', name: 'Diagnosticada', color: 'bg-orange-500', textColor: 'text-orange-700' },
                  { key: 'para-entregar', name: 'Para Entregar', color: 'bg-green-500', textColor: 'text-green-700' },
                  { key: 'listos', name: 'Listos', color: 'bg-purple-500', textColor: 'text-purple-700' }
                ].map((status) => {
                  const count = byStatus[status.key] || 0
                  const percentage = totalRepairs > 0 ? ((count / totalRepairs) * 100) : 0
                  
                  return (
                    <div key={status.key} className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${status.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">{status.name}</span>
                          <span className={`text-sm font-bold ${status.textColor}`}>
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className={`h-2 rounded-full ${status.color}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tipos de problemas más comunes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tipos de Problemas Más Comunes
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.byProblemType || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([type, count]) => {
                    const percentage = totalRepairs > 0 ? ((count / totalRepairs) * 100) : 0
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 bg-primary-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Reparaciones por mes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reparaciones por Mes
              </h3>
              <div className="space-y-3">
                {last6Months.map(month => {
                  const count = monthlyStats[month.key]
                  const percentage = maxMonthlyCount > 0 ? ((count / maxMonthlyCount) * 100) : 0
                  
                  return (
                    <div key={month.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 w-20">
                        {month.name}
                      </span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alertas y recordatorios */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alertas y Recordatorios
              </h3>
              <div className="space-y-3">
                {overdue > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Reparaciones Vencidas</p>
                      <p className="text-xs text-red-600">
                        {overdue} reparación{overdue !== 1 ? 'es' : ''} pasaron su fecha de entrega
                      </p>
                    </div>
                    <span className="text-lg font-bold text-red-600">{overdue}</span>
                  </div>
                )}

                {dueSoon > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">Próximas a Vencer</p>
                      <p className="text-xs text-yellow-600">
                        {dueSoon} reparación{dueSoon !== 1 ? 'es' : ''} vencen pronto
                      </p>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{dueSoon}</span>
                  </div>
                )}

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Ingreso Total Reportado</p>
                      <p className="text-xs text-blue-600">Según los datos del backend</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      ${Number(totalRevenue).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Tiempo Promedio
                      </p>
                      <p className="text-xs text-green-600">
                        Estimado de reparación
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      3-5 días
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsModal
