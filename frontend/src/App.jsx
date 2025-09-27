import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Header from './components/Header'
import KanbanBoard from './components/KanbanBoard'
import RepairModal from './components/RepairModal'
import StatsModal from './components/StatsModal'
import GeminiTest from './components/GeminiTest'
import TestComponent from './TestComponent'
import { repairService } from './services/repairService'
import { Loader2, X } from 'lucide-react'

function App() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isGeminiTestOpen, setIsGeminiTestOpen] = useState(false)
  const [editingRepair, setEditingRepair] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadRepairs()
    loadStats()
  }, [])

  const loadRepairs = async (filters = {}) => {
    try {
      setLoading(true)
      console.log('🔄 Iniciando carga de reparaciones...')
      
      // Mostrar toast de carga para operaciones largas
      const loadingToast = toast.loading('Cargando reparaciones... Esto puede tomar unos minutos.')
      
      const data = await repairService.getAllRepairs(filters)
      setRepairs(Array.isArray(data) ? data : [])
      
      toast.dismiss(loadingToast)
      toast.success(`${Array.isArray(data) ? data.length : 0} reparaciones cargadas`)
      
    } catch (error) {
      console.error('Error cargando reparaciones:', error)
      
      // Mensajes específicos según el tipo de error
      if (error.message.includes('Timeout')) {
        toast.error('El servidor está tardando mucho en responder. Las imágenes son pesadas, pero sigue intentando cargar...', {
          duration: 8000
        })
      } else if (error.message.includes('network') || error.message.includes('ERR_NETWORK')) {
        toast.error('No se puede conectar al servidor. Verifica que esté ejecutándose.')
      } else {
        toast.error(`Error cargando reparaciones: ${error.message}`)
      }
      
      setRepairs([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await repairService.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setStats(null)
    }
  }

  const handleCreateRepair = async (payload) => {
    try {
      const data = await repairService.createRepair(payload)
      setRepairs((prev) => [data, ...prev])
      setIsModalOpen(false)
      toast.success(`Reparación creada para ${data.ownerName}`)
      loadStats()
    } catch (error) {
      toast.error(error.message || 'Error creando la reparación')
    }
  }

  const handleUpdateRepair = async (id, payload) => {
    try {
      const data = await repairService.updateRepair(id, payload)
      setRepairs((prev) => prev.map((repair) => (repair.id === id ? data : repair)))
      setEditingRepair(null)
      setIsModalOpen(false)
      toast.success('Reparación actualizada correctamente')
      loadStats()
    } catch (error) {
      toast.error(error.message || 'Error actualizando la reparación')
    }
  }

  const handleDeleteRepair = async (id) => {
    const repair = repairs.find((r) => r.id === id)
    if (!repair) return

    if (window.confirm(`¿Estás seguro de eliminar la reparación de ${repair.ownerName}?`)) {
      try {
        await repairService.deleteRepair(id)
        setRepairs((prev) => prev.filter((r) => r.id !== id))
        toast.success(`Reparación de ${repair.ownerName} eliminada`)
        loadStats()
      } catch (error) {
        toast.error(error.message || 'Error eliminando la reparación')
      }
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const data = await repairService.changeStatus(id, newStatus)
      setRepairs((prev) => prev.map((repair) => (repair.id === id ? data : repair)))
      const statusNames = {
        ingresado: 'Ingresado',
        diagnosticada: 'Diagnosticada',
        'para-entregar': 'Para Entregar',
        listos: 'Listos'
      }
      toast.success(`${data.ownerName} movido a ${statusNames[newStatus] || newStatus}`)
      loadStats()
    } catch (error) {
      toast.error(error.message || 'Error cambiando el estado')
      loadRepairs()
    }
  }

  const handleWhatsApp = (repair) => {
    try {
      const cleanNumber = repair.whatsappNumber.replace(/[^\d+]/g, '')
      const message = `Hola ${repair.ownerName}, te contacto desde el taller de reparaciones IT sobre tu equipo (Orden #${repair.id}). ¿Cómo estás?`
      const whatsappUrl = `https://wa.me/${cleanNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      toast.success(`Abriendo WhatsApp para contactar a ${repair.ownerName}`)
    } catch (error) {
      toast.error('No se pudo abrir WhatsApp')
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    const trimmed = query.trim()
    
    // Easter egg: abrir pruebas de Gemini
    if (trimmed.toLowerCase() === '?gemini' || trimmed.toLowerCase() === '?test') {
      setIsGeminiTestOpen(true)
      return
    }
    
    if (!trimmed || trimmed.length < 2) {
      // Si la búsqueda está vacía o muy corta, cargar todas las reparaciones
      loadRepairs()
      return
    }

    try {
      // Usar búsqueda con debounce para mejor rendimiento
      const data = await repairService.searchRepairsDebounced(trimmed, 300)
      setRepairs(Array.isArray(data) ? data : [])
      
      if (data.length === 0) {
        toast.info(`No se encontraron resultados para "${trimmed}"`)
      } else {
        toast.success(`${data.length} resultados encontrados`)
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      toast.error('Error realizando la búsqueda. Intenta nuevamente.')
    }
  }

  const openEditModal = (repair) => {
    setEditingRepair(repair)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRepair(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando reparaciones...</p>
        </div>
      </div>
    )
  }

  // Mostrar componente de prueba si no hay reparaciones
  if (repairs.length === 0 && !loading) {
    return <TestComponent />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCreateRepair={() => setIsModalOpen(true)}
        onShowStats={() => setIsStatsOpen(true)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        stats={stats}
      />

      <KanbanBoard
        repairs={repairs}
        onStatusChange={handleStatusChange}
        onEditRepair={openEditModal}
        onDeleteRepair={handleDeleteRepair}
        onWhatsApp={handleWhatsApp}
      />

      {isModalOpen && (
        <RepairModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={editingRepair ? (data) => handleUpdateRepair(editingRepair.id, data) : handleCreateRepair}
          repair={editingRepair}
          title={editingRepair ? 'Editar Reparación' : 'Nueva Reparación'}
        />
      )}

      {isStatsOpen && (
        <StatsModal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          stats={stats}
          repairs={repairs}
        />
      )}

      {isGeminiTestOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pruebas de Gemini AI</h2>
              <button
                onClick={() => setIsGeminiTestOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <GeminiTest />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
