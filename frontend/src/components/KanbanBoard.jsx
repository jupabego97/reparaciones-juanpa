import React from 'react'
import { useDrop } from 'react-dnd'
import RepairCard from './RepairCard'

const COLUMNS = [
  {
    id: 'ingresado',
    title: 'Ingresado',
    color: 'blue'
  },
  {
    id: 'diagnosticada',
    title: 'Diagnosticada',
    color: 'orange'
  },
  {
    id: 'para-entregar',
    title: 'Para Entregar',
    color: 'green'
  },
  {
    id: 'listos',
    title: 'Entregados',
    color: 'purple'
  }
]

const KanbanColumn = ({ 
  column, 
  repairs, 
  onStatusChange, 
  onEditRepair, 
  onDeleteRepair, 
  onWhatsApp 
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'repair',
    drop: (item) => {
      if (item.status !== column.id) {
        onStatusChange(item.id, column.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  const columnRepairs = repairs.filter(repair => repair.status === column.id)
  console.log(`Columna ${column.title} - repairs:`, columnRepairs)

  const getColumnHeaderStyle = (color) => {
    switch (color) {
      case 'blue':
        return 'border-t-4 border-t-blue-500'
      case 'orange':
        return 'border-t-4 border-t-orange-500'
      case 'green':
        return 'border-t-4 border-t-green-500'
      case 'purple':
        return 'border-t-4 border-t-purple-500'
      default:
        return 'border-t-4 border-t-gray-500'
    }
  }

  const getColumnIndicator = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500'
      case 'orange':
        return 'bg-orange-500'
      case 'green':
        return 'bg-green-500'
      case 'purple':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      ref={drop}
      className={`
        flex-1 min-w-[280px] bg-white rounded-lg shadow-sm border border-gray-200
        ${isOver ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
        transition-all duration-200 ${getColumnHeaderStyle(column.color)}
      `}
    >
      {/* Header de la columna */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getColumnIndicator(column.color)}`}></div>
            <h3 className="font-medium text-gray-900 text-sm">{column.title}</h3>
          </div>
          <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
            {columnRepairs.length}
          </div>
        </div>
      </div>

      {/* Contenido de la columna */}
      <div className={`
        p-3 min-h-[600px] space-y-3 bg-gray-50
        ${isOver ? 'bg-blue-50' : ''}
      `}>
        {columnRepairs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              No hay reparaciones en {column.title.toLowerCase()}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Arrastra las tarjetas aquí
            </p>
          </div>
        ) : (
          columnRepairs
            .sort((a, b) => {
              // Ordenar por prioridad y fecha de creación
              const priorityOrder = { high: 3, normal: 2, low: 1 }
              const aPriority = priorityOrder[a.priority] || 2
              const bPriority = priorityOrder[b.priority] || 2
              
              if (aPriority !== bPriority) {
                return bPriority - aPriority
              }
              
              return new Date(b.createdAt) - new Date(a.createdAt)
            })
            .map(repair => (
              <RepairCard
                key={repair.id}
                repair={repair}
                onEdit={() => onEditRepair(repair)}
                onDelete={() => onDeleteRepair(repair.id)}
                onWhatsApp={() => onWhatsApp(repair)}
                columnColor={column.color}
              />
            ))
        )}
      </div>
    </div>
  )
}

const KanbanBoard = ({ 
  repairs, 
  onStatusChange, 
  onEditRepair, 
  onDeleteRepair, 
  onWhatsApp 
}) => {
  console.log('KanbanBoard - repairs recibidas:', repairs)
  
  return (
    <div className="px-4 pb-6 bg-gray-50">
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-[700px]">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            repairs={repairs || []}
            onStatusChange={onStatusChange}
            onEditRepair={onEditRepair}
            onDeleteRepair={onDeleteRepair}
            onWhatsApp={onWhatsApp}
          />
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
