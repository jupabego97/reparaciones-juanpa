import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_PREFIX = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 segundos - aumentado para manejar imágenes grandes
  headers: {
    'Content-Type': 'application/json'
  }
})

const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
const camelToSnake = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

const transformKeysToCamel = (value) => {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(transformKeysToCamel)

  const entries = Object.entries(value).map(([key, val]) => [snakeToCamel(key), transformKeysToCamel(val)])
  return Object.fromEntries(entries)
}

const normalizeStatus = (status = '') => {
  const normalized = status.toLowerCase()
  const statusMap = {
    'entregados': 'listos',
    'entregado': 'listos',
    'entrega': 'listos',
    'paraentregar': 'para-entregar',
    'para entregar': 'para-entregar',
    'para-entrega': 'para-entregar'
  }
  return statusMap[normalized] || normalized
}

const normalizeRepair = (repair) => {
  if (!repair || typeof repair !== 'object') return repair
  
  // Manejar tanto camelCase como snake_case para compatibilidad
  const imageUrl = repair.imageUrl || repair.image_url || ''
  
  return {
    ...repair,
    status: normalizeStatus(repair.status),
    imageUrl: typeof imageUrl === 'string' ? imageUrl.trim() : imageUrl
  }
}

const transformKeysToSnake = (value) => {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(transformKeysToSnake)

  const entries = Object.entries(value).map(([key, val]) => [camelToSnake(key), transformKeysToSnake(val)])
  return Object.fromEntries(entries)
}

api.interceptors.request.use(
  (config) => {
    if (config.data && typeof config.data === 'object') {
      config.data = transformKeysToSnake(config.data)
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    
    // Manejar diferentes tipos de errores
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Timeout: El servidor está tardando en responder. Intenta nuevamente.'))
    }
    
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Error de red: No se puede conectar al servidor.'))
    }
    
    const message = error.response?.data?.detail || error.message || 'Error desconocido'
    return Promise.reject(new Error(message))
  }
)

export const repairService = {
  async getAllRepairs(params = {}) {
    try {
      // Determinar si es carga inicial o búsqueda
      const isInitialLoad = !params.search && !params.status
      const limit = isInitialLoad ? 100 : (params.limit || 500) // Cargar menos inicialmente
      
      console.log(`🔄 Cargando reparaciones... ${isInitialLoad ? '(carga inicial rápida)' : '(búsqueda completa)'}`)
      
      const response = await api.get(`${API_PREFIX}/repairs`, {
        params: {
          limit,
          ...params,
        },
        timeout: isInitialLoad ? 30000 : 120000 // Timeout más corto para carga inicial
      })
      
      console.log('✅ Reparaciones cargadas:', response.data?.length || 0)
      
      const transformed = Array.isArray(response.data)
        ? response.data.map(transformKeysToCamel).map(normalizeRepair)
        : normalizeRepair(transformKeysToCamel(response.data))
      
      // Debug: verificar imágenes solo en carga inicial para no saturar logs
      if (Array.isArray(transformed) && isInitialLoad) {
        const withImages = transformed.filter(item => item.imageUrl && item.imageUrl.length > 100)
        console.log(`🖼️  ${withImages.length}/${transformed.length} reparaciones tienen imágenes`)
        
        // Mostrar algunos ejemplos solo en desarrollo
        if (import.meta.env.DEV) {
          transformed.slice(0, 3).forEach(item => {
            const hasImg = item.imageUrl && item.imageUrl.length > 100 ? '🖼️' : '❌'
            console.log(`   ${hasImg} ID ${item.id}: ${item.ownerName} - ${item.imageUrl ? item.imageUrl.length : 0} chars`)
          })
        }
      }
      
      return transformed
    } catch (error) {
      console.error('❌ Error cargando reparaciones:', error.message)
      throw error
    }
  },

  // Cargar más reparaciones (para implementar "Load More" en el futuro)
  async loadMoreRepairs(skip = 0, limit = 50) {
    try {
      console.log(`📄 Cargando más reparaciones (skip: ${skip}, limit: ${limit})...`)
      
      const response = await api.get(`${API_PREFIX}/repairs`, {
        params: { skip, limit },
        timeout: 60000
      })
      
      const transformed = Array.isArray(response.data)
        ? response.data.map(transformKeysToCamel).map(normalizeRepair)
        : []
      
      console.log(`✅ ${transformed.length} reparaciones adicionales cargadas`)
      return transformed
      
    } catch (error) {
      console.error('❌ Error cargando más reparaciones:', error)
      throw error
    }
  },

  async getRepairById(id) {
    const response = await api.get(`${API_PREFIX}/repairs/${id}`)
    return normalizeRepair(transformKeysToCamel(response.data))
  },

  async getRepairsByStatus(status) {
    const response = await api.get(`${API_PREFIX}/repairs/status/${status}`)
    const payload = Array.isArray(response.data)
      ? response.data.map(transformKeysToCamel).map(normalizeRepair)
      : normalizeRepair(transformKeysToCamel(response.data))
      return payload
  },

  async createRepair(data) {
    const response = await api.post(`${API_PREFIX}/repairs`, data)
    return normalizeRepair(transformKeysToCamel(response.data))
  },

  async updateRepair(id, data) {
    const response = await api.put(`${API_PREFIX}/repairs/${id}`, data)
    return normalizeRepair(transformKeysToCamel(response.data))
  },

  async changeStatus(id, status, note = '') {
    const response = await api.patch(`${API_PREFIX}/repairs/${id}/status`, { status, note })
    return normalizeRepair(transformKeysToCamel(response.data))
  },

  async deleteRepair(id) {
    const response = await api.delete(`${API_PREFIX}/repairs/${id}`)
    return response.data
  },

  async searchRepairs(query) {
    try {
      if (!query || query.trim().length < 2) {
        // Para búsquedas muy cortas, devolver array vacío
        return []
      }
      
      console.log('🔍 Búsqueda rápida:', query)
      
      // Usar endpoint de búsqueda rápida
      const response = await api.get(`${API_PREFIX}/repairs/search?q=${encodeURIComponent(query)}&limit=50`, {
        timeout: 10000 // 10 segundos para búsquedas
      })
      
      const results = response.data.map(repair => {
        const transformed = transformKeysToCamel(repair)
        return {
          ...transformed,
          status: normalizeStatus(transformed.status)
        }
      })
      
      console.log(`✅ Búsqueda completada: ${results.length} resultados`)
      return results
      
    } catch (error) {
      console.error('❌ Error en búsqueda rápida:', error)
      // Fallback al método normal si falla la búsqueda rápida
      try {
        console.log('🔄 Usando búsqueda fallback...')
        return this.getAllRepairs({ search: query })
      } catch (fallbackError) {
        console.error('❌ Error en búsqueda fallback:', fallbackError)
        throw error
      }
    }
  },

  // Buscar reparaciones con debounce para evitar muchas consultas
  searchRepairsDebounced(query, delay = 300) {
    return new Promise((resolve) => {
      clearTimeout(this._searchTimeout)
      this._searchTimeout = setTimeout(async () => {
        try {
          const results = await this.searchRepairs(query)
          resolve(results)
        } catch (error) {
          console.error('Error en búsqueda con debounce:', error)
          resolve([])
        }
      }, delay)
    })
  },

  async getStats() {
    try {
      console.log('📊 Cargando estadísticas...')
      const response = await api.get(`${API_PREFIX}/stats`, {
        timeout: 60000 // 1 minuto para estadísticas
      })
      console.log('✅ Estadísticas cargadas')
      return transformKeysToCamel(response.data)
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error.message)
      throw error
    }
  },

  async getOverdueRepairs() {
    const response = await api.get(`${API_PREFIX}/repairs/overdue`)
    const payload = response.data.map(transformKeysToCamel).map(normalizeRepair)
      return payload
  },

  async getDueSoonRepairs() {
    const response = await api.get(`${API_PREFIX}/repairs/due-soon`)
    const payload = response.data.map(transformKeysToCamel).map(normalizeRepair)
      return payload
  },

  async createBackup() {
    throw new Error('Funcionalidad no disponible en el backend actual')
  },

  async addNote() {
    throw new Error('Funcionalidad de notas no disponible en el backend actual')
  },

  async healthCheck() {
    const response = await api.get(`${API_PREFIX}/health`)
    return response.data
  }
}

export const repairUtils = {
  formatWhatsAppNumber(number) {
    const cleaned = number.replace(/[^\d+]/g, '')
    if (!cleaned.startsWith('+') && cleaned.length === 10) return `+57${cleaned}`
    if (!cleaned.startsWith('+')) return `+${cleaned}`
    return cleaned
  },

  generateWhatsAppMessage(repair) {
    return `Hola ${repair.ownerName}, te contacto desde el taller de reparaciones IT sobre tu equipo (Orden #${repair.id}). ¿Cómo estás?`
  },

  openWhatsApp(repair) {
    const number = this.formatWhatsAppNumber(repair.whatsappNumber)
    const url = `https://wa.me/${number.replace('+', '')}?text=${encodeURIComponent(this.generateWhatsAppMessage(repair))}`
    window.open(url, '_blank')
  },

  validateRepairData(data) {
    const errors = {}

    if (!data.ownerName?.trim()) errors.ownerName = 'El nombre del propietario es requerido'
    if (!data.problemType?.trim()) errors.problemType = 'El tipo de problema es requerido'

    if (!data.whatsappNumber?.trim()) {
      errors.whatsappNumber = 'El número de WhatsApp es requerido'
    } else {
      const cleaned = data.whatsappNumber.replace(/[^\d+]/g, '')
      if (cleaned.length < 10) errors.whatsappNumber = 'Número de WhatsApp inválido'
    }

    if (!data.dueDate) {
      errors.dueDate = 'La fecha de entrega es requerida'
    } else if (new Date(data.dueDate) <= new Date()) {
      errors.dueDate = 'La fecha de entrega debe ser futura'
    }

    if (data.estimatedCost && Number(data.estimatedCost) < 0) {
      errors.estimatedCost = 'El costo estimado no puede ser negativo'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  },

  STATUSES: [
    { key: 'ingresado', name: 'Ingresado', color: 'blue' },
    { key: 'diagnosticada', name: 'Diagnosticada', color: 'orange' },
    { key: 'para-entregar', name: 'Para Entregar', color: 'green' },
    { key: 'listos', name: 'Entregados', color: 'purple' }
  ],

  PRIORITIES: [
    { key: 'low', name: 'Baja', color: 'gray' },
    { key: 'normal', name: 'Normal', color: 'blue' },
    { key: 'high', name: 'Alta', color: 'orange' },
    { key: 'urgent', name: 'Urgente', color: 'red' }
  ],

  PROBLEM_TYPES: [
    'Hardware',
    'Software',
    'Virus/Malware',
    'Pantalla',
    'Teclado',
    'Batería',
    'Disco Duro',
    'Memoria RAM',
    'Sistema Operativo',
    'Otro'
  ]
}

export default repairService
