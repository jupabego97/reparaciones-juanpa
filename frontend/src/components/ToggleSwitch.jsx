import React from 'react'

const ToggleSwitch = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && <p className="text-gray-400 text-xs">{description}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={checked === true}
            onChange={() => onChange(true)}
            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-white text-sm">Sí</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={checked === false}
            onChange={() => onChange(false)}
            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-white text-sm">No</span>
        </label>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            checked ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default ToggleSwitch
