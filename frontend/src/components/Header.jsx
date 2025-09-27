import React, { useState } from 'react'
import { Monitor, Plus, BarChart3, Search, Filter } from 'lucide-react'

const Header = ({ onCreateRepair, onShowStats, onSearch, searchQuery, stats }) => {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header con título */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 text-blue-600">
            <Monitor className="w-5 h-5" />
            <span className="text-sm font-medium">REPARACIONES-NANO</span>
          </div>
        </div>
      </div>

      {/* Botón Nueva Reparación */}
      <div className="px-4 py-4 bg-gray-50">
        <button
          onClick={onCreateRepair}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nueva Reparación</span>
        </button>
      </div>

      {/* Barra de búsqueda y controles */}
      <div className="px-4 pb-4 bg-gray-50">
        <div className="flex items-center space-x-3">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Botón Métricas */}
          <button
            onClick={onShowStats}
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Métricas</span>
          </button>

          {/* Botón Ver Problemas */}
          <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">Ver Problemas</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header
