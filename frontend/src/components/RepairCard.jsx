import React, { useState } from 'react'
import { useDrag } from 'react-dnd'
import { Edit3, Trash2, Phone, Calendar, Clock } from 'lucide-react'
import moment from 'moment'

const RepairCard = ({ repair, onEdit, onDelete, onWhatsApp, columnColor }) => {
  const [imageError, setImageError] = useState(false)
  
  const [{ isDragging }, drag] = useDrag({
    type: 'repair',
    item: { id: repair.id, status: repair.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ingresado':
        return 'bg-blue-100 text-blue-800'
      case 'diagnosticada':
        return 'bg-orange-100 text-orange-800'
      case 'para-entregar':
        return 'bg-green-100 text-green-800'
      case 'listos':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'ingresado':
        return 'Ingresado'
      case 'diagnosticada':
        return 'Diagnosticada'
      case 'para-entregar':
        return 'Para Entregar'
      case 'listos':
        return 'Entregado'
      default:
        return status
    }
  }

  const getChargerStatus = (hasCharger) => {
    if (hasCharger) {
      return { text: 'Con cargador', color: 'text-green-600' }
    } else {
      return { text: 'Sin cargador', color: 'text-red-600' }
    }
  }

  const chargerStatus = getChargerStatus(repair.hasCharger)

  // Función para obtener la URL de la imagen (enfoque simple como reparaciones-nano)
  const getImageSrc = () => {
    // Si tiene imagen, usar directamente (como reparaciones-nano)
    if (repair.imageUrl && repair.imageUrl.trim() !== '') {
      return repair.imageUrl
    }
    
    // Si no tiene imagen, usar placeholder
    return `https://picsum.photos/250/150?random=${repair.id}`
  }

  return (
    <div
      ref={drag}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        p-3 cursor-move transition-all duration-200
        ${isDragging ? 'opacity-50 transform rotate-1' : ''}
        hover:shadow-md
      `}
    >
      {/* Nombre del cliente */}
      <div className="mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">
          {repair.ownerName}
        </h4>
      </div>

      {/* Botones de acción en la parte superior */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Editar"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Badge de estado */}
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(repair.status)}`}>
          {getStatusText(repair.status)}
        </span>
      </div>

      {/* Información de contacto */}
      <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
        <Phone className="w-4 h-4" />
        <span className="text-xs">{repair.whatsappNumber}</span>
        <span className={`text-xs font-medium ${chargerStatus.color}`}>
          {chargerStatus.text}
        </span>
      </div>

      {/* Descripción del problema */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">
          {repair.description || repair.problemType}
        </p>
      </div>

      {/* Imagen del equipo con lazy loading */}
      <div className="mb-3">
        {!imageError ? (
          <img
            src={getImageSrc()}
            alt={`Equipo de ${repair.ownerName}`}
            className="w-full h-24 object-cover rounded-lg bg-gray-100"
            loading="lazy" // Lazy loading nativo
            onError={() => setImageError(true)}
            onLoad={() => {
              // Opcional: log cuando la imagen se carga
              if (import.meta.env.DEV && repair.imageUrl && repair.imageUrl.length > 100) {
                console.log(`🖼️ Imagen cargada para ${repair.ownerName}`)
              }
            }}
          />
        ) : (
          <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Fechas */}
      <div className="space-y-2 mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">
            {moment(repair.createdAt).format('DD/MM/YYYY')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">
            {moment(repair.dueDate).format('DD/MM/YYYY')}
          </span>
        </div>
      </div>

      {/* Botón de contacto */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onWhatsApp()
        }}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
      >
        <span>Contactar</span>
      </button>
    </div>
  )
}

export default RepairCard
