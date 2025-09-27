// Script para debuggear el servicio de reparaciones
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'
const API_PREFIX = '/api'

async function testService() {
  try {
    console.log('🔍 Probando servicio de reparaciones...')
    
    // Probar conexión directa
    const response = await axios.get(`${API_BASE_URL}${API_PREFIX}/repairs?limit=5`, {
      timeout: 30000
    })
    
    console.log('✅ Respuesta del servidor:', {
      status: response.status,
      dataLength: response.data?.length,
      firstItem: response.data?.[0]
    })
    
    // Transformar datos como lo hace el servicio
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
    
    const transformed = response.data.map(transformKeysToCamel)
    console.log('🔄 Datos transformados:', {
      length: transformed.length,
      firstTransformed: transformed[0]
    })
    
    return transformed
    
  } catch (error) {
    console.error('❌ Error en el servicio:', error)
    throw error
  }
}

// Ejecutar prueba
testService()
  .then(data => {
    console.log('🎉 Prueba exitosa:', data.length, 'reparaciones')
  })
  .catch(error => {
    console.error('💥 Prueba falló:', error.message)
  })
