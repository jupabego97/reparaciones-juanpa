import axios from 'axios'

// Configuración simple para debug
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_PREFIX = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para debug
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url, 'Data length:', response.data?.length || 'No array')
    return response
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message)
    throw new Error(error.response?.data?.detail || error.message || 'Error desconocido')
  }
)

// Función de transformación simple
const transformKeysToCamel = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(transformKeysToCamel)

  const camelObj = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    camelObj[camelKey] = transformKeysToCamel(value)
  }
  return camelObj
}

export const repairServiceDebug = {
  async getAllRepairs() {
    try {
      console.log('🔄 [DEBUG] Cargando reparaciones...')
      
      const response = await api.get(`${API_PREFIX}/repairs?limit=500`)
      console.log('📊 [DEBUG] Raw response:', response.data)
      
      if (!Array.isArray(response.data)) {
        console.error('❌ [DEBUG] Response is not an array:', typeof response.data)
        return []
      }
      
      const transformed = response.data.map(transformKeysToCamel)
      console.log('🔄 [DEBUG] Transformed data:', transformed.length, 'items')
      console.log('🔍 [DEBUG] First item:', transformed[0])
      
      return transformed
      
    } catch (error) {
      console.error('❌ [DEBUG] Error in getAllRepairs:', error)
      throw error
    }
  },

  async healthCheck() {
    try {
      const response = await api.get(`${API_PREFIX}/health`)
      return response.data
    } catch (error) {
      console.error('❌ [DEBUG] Health check failed:', error)
      throw error
    }
  }
}

export default repairServiceDebug
