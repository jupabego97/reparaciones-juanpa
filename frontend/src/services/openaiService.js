import OpenAI from 'openai'

// Configuración de OpenAI
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY'

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true // Necesario para uso en navegador
    })
    
    // Control de rate limiting
    this.lastRequestTime = 0
    this.minInterval = 1000 // 1 segundo entre requests para GPT-4
  }

  // Convertir archivo a base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result) // Incluye el prefijo data:image/...
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Control de rate limiting
  async waitForRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest
      console.log(`⏳ Esperando ${waitTime}ms para respetar límites de API...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  // Extraer información del equipo desde la imagen
  async extractEquipmentInfo(imageFile, retryCount = 0) {
    try {
      console.log('🤖 Analizando imagen con GPT-4 Vision...')
      
      // Respetar límites de rate
      await this.waitForRateLimit()
      
      const base64Image = await this.fileToBase64(imageFile)
      
      const prompt = `
Eres un experto en análisis de imágenes de equipos electrónicos. Analiza cuidadosamente esta imagen y extrae la siguiente información:

🔍 INFORMACIÓN A BUSCAR:

1. **NOMBRE DEL CLIENTE**: 
   - Busca etiquetas adhesivas, stickers, notas pegadas, papeles
   - Texto escrito a mano o impreso con nombres de personas
   - Etiquetas de inventario con nombres
   - Cualquier identificación del propietario

2. **NÚMERO DE WHATSAPP/TELÉFONO**:
   - Números escritos en etiquetas o papeles
   - Formatos: +57 XXX XXX XXXX, +1 XXX XXX XXXX, etc.
   - Números de 10 dígitos (ej: 3001234567)
   - Números con guiones, espacios o puntos

3. **CARGADOR**:
   - Cable de alimentación conectado o cerca del equipo
   - Adaptador de corriente/transformador
   - Cable USB-C, MagSafe, barrel connector
   - Cualquier cable de carga visible

4. **TIPO DE EQUIPO**:
   - Laptop, computadora de escritorio, tablet, etc.
   - Identifica la categoría del dispositivo

5. **MARCA Y MODELO**:
   - Logos visibles (Dell, HP, Lenovo, Apple, etc.)
   - Modelos específicos si son legibles

⚠️ INSTRUCCIONES CRÍTICAS:
- Si NO encuentras información específica, usa exactamente "NO_ENCONTRADO"
- Para cargador: usa exactamente "SÍ" o "NO"
- Para nombres: extrae el texto completo tal como aparece
- Para teléfonos: incluye código de país si está visible

📋 RESPONDE SOLO CON ESTE JSON (sin texto adicional):
{
  "nombreCliente": "nombre completo encontrado o NO_ENCONTRADO",
  "whatsappNumber": "número completo con código país o NO_ENCONTRADO", 
  "tieneCargador": "SÍ o NO",
  "tipoEquipo": "tipo específico del equipo",
  "marcaModelo": "marca y modelo específico o NO_ENCONTRADO"
}
`

      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // GPT-4 con capacidades de visión
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                  detail: "high" // Alta resolución para mejor análisis
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })

      const responseText = response.choices[0].message.content
      console.log('🤖 Respuesta de GPT-4:', responseText)

      // Intentar parsear la respuesta JSON
      try {
        // Limpiar la respuesta para extraer solo el JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No se encontró JSON válido en la respuesta')
        }
        
        const jsonResponse = JSON.parse(jsonMatch[0])
        
        // Validar y limpiar la respuesta
        console.log('🔄 Datos antes de limpiar:', jsonResponse)
        
        const cleanedResponse = {
          nombreCliente: this.cleanText(jsonResponse.nombreCliente),
          whatsappNumber: this.cleanPhoneNumber(jsonResponse.whatsappNumber),
          tieneCargador: this.cleanBooleanResponse(jsonResponse.tieneCargador),
          tipoEquipo: this.cleanText(jsonResponse.tipoEquipo),
          marcaModelo: this.cleanText(jsonResponse.marcaModelo)
        }
        
        console.log('✨ Datos después de limpiar:', cleanedResponse)

        console.log('✅ Información extraída:', cleanedResponse)
        return cleanedResponse

      } catch (parseError) {
        console.error('❌ Error parseando respuesta JSON:', parseError)
        console.log('Respuesta original:', responseText)
        
        // Fallback: intentar extraer información manualmente
        return this.extractInfoManually(responseText)
      }

    } catch (error) {
      console.error('❌ Error en OpenAI Service:', error)
      
      // Manejo específico de errores de rate limiting
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('quota')) {
        if (retryCount < 3) {
          console.log(`🔄 Reintentando en ${(retryCount + 1) * 3} segundos... (intento ${retryCount + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000))
          return this.extractEquipmentInfo(imageFile, retryCount + 1)
        } else {
          throw new Error('Límite de cuota excedido. Intenta nuevamente en unos minutos.')
        }
      }
      
      // Error de API key
      if (error.status === 401 || error.message.includes('API key')) {
        throw new Error('API key de OpenAI inválida. Verifica tu configuración.')
      }
      
      // Error de créditos
      if (error.status === 402 || error.message.includes('billing') || error.message.includes('credits')) {
        throw new Error('Sin créditos en OpenAI. Verifica tu facturación.')
      }
      
      throw new Error(`Error analizando imagen: ${error.message}`)
    }
  }

  // Limpiar texto extraído
  cleanText(text) {
    if (!text || 
        text.toUpperCase().includes('NO_ENCONTRADO') || 
        text.toUpperCase().includes('NO ENCONTRADO') ||
        text.toUpperCase().includes('NOT_FOUND') ||
        text.toUpperCase().includes('NOT FOUND') ||
        text.toUpperCase().includes('N/A') ||
        text.trim() === '') {
      return ''
    }
    return text.trim().replace(/['"]/g, '').replace(/^\w+:\s*/, '') // Remover prefijos como "Nombre: "
  }

  // Limpiar número de teléfono
  cleanPhoneNumber(phone) {
    if (!phone || 
        phone.toUpperCase().includes('NO_ENCONTRADO') ||
        phone.toUpperCase().includes('NOT_FOUND') ||
        phone.toUpperCase().includes('N/A') ||
        phone.trim() === '') {
      return ''
    }
    
    console.log('🔍 Limpiando número de teléfono:', phone)
    
    // Limpiar y formatear número - mantener solo dígitos y +
    let cleaned = phone.replace(/[^\d+]/g, '')
    console.log('📱 Número limpio:', cleaned)
    
    // Si no tiene código de país, asumir Colombia (+57)
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+57' + cleaned
      } else if (cleaned.length > 10) {
        cleaned = '+' + cleaned
      }
    }
    
    console.log('✅ Número final:', cleaned)
    return cleaned
  }

  // Limpiar respuesta booleana
  cleanBooleanResponse(response) {
    if (!response) return false
    
    const responseUpper = response.toString().toUpperCase()
    return responseUpper.includes('SÍ') || responseUpper.includes('SI') || responseUpper.includes('YES') || responseUpper.includes('TRUE')
  }

  // Extracción manual como fallback
  extractInfoManually(text) {
    console.log('🔄 Intentando extracción manual...')
    
    const result = {
      nombreCliente: '',
      whatsappNumber: '',
      tieneCargador: false,
      tipoEquipo: '',
      marcaModelo: ''
    }

    // Buscar números de teléfono
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatch = text.match(phoneRegex)
    if (phoneMatch) {
      result.whatsappNumber = this.cleanPhoneNumber(phoneMatch[0])
    }

    // Buscar indicios de cargador
    if (text.toLowerCase().includes('cargador') || text.toLowerCase().includes('cable') || text.toLowerCase().includes('adaptador')) {
      result.tieneCargador = true
    }

    // Buscar tipo de equipo
    const deviceTypes = ['laptop', 'computadora', 'pc', 'tablet', 'macbook', 'notebook']
    for (const type of deviceTypes) {
      if (text.toLowerCase().includes(type)) {
        result.tipoEquipo = type.charAt(0).toUpperCase() + type.slice(1)
        break
      }
    }

    return result
  }

  // Verificar si la API key está configurada
  isConfigured() {
    return API_KEY && API_KEY !== 'YOUR_OPENAI_API_KEY'
  }

  // Obtener información de configuración
  getConfigInfo() {
    return {
      isConfigured: this.isConfigured(),
      model: "gpt-4.1-2025-04-14",
      apiKeyStatus: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'No configurada'
    }
  }
}

// Crear instancia única
const openaiService = new OpenAIService()

export default openaiService
export { OpenAIService }
