import React, { useState, useEffect } from 'react'
import { repairServiceDebug } from './services/repairService.debug'

function TestComponent() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRepairs()
  }, [])

  const loadRepairs = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🧪 [TEST] Iniciando carga de reparaciones...')
      
      // Primero probar health check
      const health = await repairServiceDebug.healthCheck()
      console.log('💚 [TEST] Health check OK:', health)
      
      // Luego cargar reparaciones
      const data = await repairServiceDebug.getAllRepairs()
      console.log('📋 [TEST] Reparaciones cargadas:', data.length)
      
      setRepairs(data)
      
    } catch (err) {
      console.error('💥 [TEST] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Test Component</h1>
        <div className="text-blue-600">Cargando reparaciones...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Test Component</h1>
        <div className="text-red-600 mb-4">❌ Error: {error}</div>
        <button 
          onClick={loadRepairs}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Component</h1>
      <div className="mb-4">
        <strong>Total reparaciones: {repairs.length}</strong>
      </div>
      
      {repairs.length === 0 ? (
        <div className="text-yellow-600">⚠️ No hay reparaciones</div>
      ) : (
        <div className="space-y-2">
          {repairs.slice(0, 5).map((repair, index) => (
            <div key={repair.id || index} className="border p-2 rounded">
              <div><strong>ID:</strong> {repair.id}</div>
              <div><strong>Cliente:</strong> {repair.ownerName}</div>
              <div><strong>Estado:</strong> {repair.status}</div>
              <div><strong>Imagen:</strong> {repair.imageUrl ? '✅ Sí' : '❌ No'}</div>
            </div>
          ))}
          {repairs.length > 5 && (
            <div className="text-gray-500">... y {repairs.length - 5} más</div>
          )}
        </div>
      )}
      
      <button 
        onClick={loadRepairs}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Recargar
      </button>
    </div>
  )
}

export default TestComponent
