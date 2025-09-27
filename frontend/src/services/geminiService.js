import { GoogleGenerativeAI } from '@google/generative-ai'

// Configuración de Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'
const genAI = new GoogleGenerativeAI(API_KEY)

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      }
    })
    
    // Control de rate limiting
    this.lastRequestTime = 0
    this.minInterval = 4000 // 4 segundos entre requests (15 RPM = 4s interval)
  }

  // Convertir archivo a base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
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
      console.log('🤖 Analizando imagen con Gemini Flash 2.5...')
      
      // Respetar límites de rate
      await this.waitForRateLimit()
      
      const base64Image = await this.fileToBase64(imageFile)
      
      const prompt = `
Analiza esta imagen de un equipo electrónico (laptop, computadora, tablet, etc.) y extrae la siguiente información si está visible:

1. NOMBRE DEL CLIENTE: Busca cualquier etiqueta, sticker, papel o texto que indique el nombre del propietario
2. NÚMERO DE WHATSAPP: Busca números de teléfono con formato +57, +1, etc. o números de 10 dígitos
3. CARGADOR: Determina si hay un cargador visible en la imagen (cable de alimentación, adaptador de corriente)
4. TIPO DE EQUIPO: Identifica qué tipo de dispositivo es (laptop, PC, tablet, etc.)
5. MARCA Y MODELO: Si es posible identificar la marca y modelo del equipo

IMPORTANTE: 
- Si no puedes encontrar información específica, responde "NO_ENCONTRADO"
- Para el cargador, responde solo "SÍ" o "NO"
- Para números de WhatsApp, incluye el código de país si está visible

Responde ÚNICAMENTE en el siguiente formato JSON:
{
  "nombreCliente": "nombre encontrado o NO_ENCONTRADO",
  "whatsappNumber": "número con código de país o NO_ENCONTRADO",
  "tieneCargador": "SÍ o NO",
  "tipoEquipo": "tipo de dispositivo identificado",
  "marcaModelo": "marca y modelo si es identificable o NO_ENCONTRADO"
}
`

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: imageFile.type
        }
      }

      const result = await this.model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      console.log('🤖 Respuesta de Gemini:', text)

      // Intentar parsear la respuesta JSON
      try {
        // Limpiar la respuesta para extraer solo el JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No se encontró JSON válido en la respuesta')
        }
        
        const jsonResponse = JSON.parse(jsonMatch[0])
        
        // Validar y limpiar la respuesta
        const cleanedResponse = {
          nombreCliente: this.cleanText(jsonResponse.nombreCliente),
          whatsappNumber: this.cleanPhoneNumber(jsonResponse.whatsappNumber),
          tieneCargador: this.cleanBooleanResponse(jsonResponse.tieneCargador),
          tipoEquipo: this.cleanText(jsonResponse.tipoEquipo),
          marcaModelo: this.cleanText(jsonResponse.marcaModelo)
        }

        console.log('✅ Información extraída:', cleanedResponse)
        return cleanedResponse

      } catch (parseError) {
        console.error('❌ Error parseando respuesta JSON:', parseError)
        console.log('Respuesta original:', text)
        
        // Fallback: intentar extraer información manualmente
        return this.extractInfoManually(text)
      }

    } catch (error) {
      console.error('❌ Error en Gemini Service:', error)
      
      // Manejo específico de errores de rate limiting
      if (error.message.includes('Quota exceeded') || error.message.includes('RATE_LIMIT_EXCEEDED')) {
        if (retryCount < 3) {
          console.log(`🔄 Reintentando en ${(retryCount + 1) * 5} segundos... (intento ${retryCount + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 5000))
          return this.extractEquipmentInfo(imageFile, retryCount + 1)
        } else {
          throw new Error('Límite de cuota excedido. Intenta nuevamente en unos minutos.')
        }
      }
      
      // Otros errores
      if (error.message.includes('API key')) {
        throw new Error('API key de Gemini inválida. Verifica tu configuración.')
      }
      
      throw new Error(`Error analizando imagen: ${error.message}`)
    }
  }

  // Limpiar texto extraído
  cleanText(text) {
    if (!text || text.toUpperCase().includes('NO_ENCONTRADO') || text.toUpperCase().includes('NO ENCONTRADO')) {
      return ''
    }
    return text.trim().replace(/['"]/g, '')
  }

  // Limpiar número de teléfono
  cleanPhoneNumber(phone) {
    if (!phone || phone.toUpperCase().includes('NO_ENCONTRADO')) {
      return ''
    }
    
    // Limpiar y formatear número
    let cleaned = phone.replace(/[^\d+]/g, '')
    
    // Si no tiene código de país, asumir Colombia (+57)
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+57' + cleaned
      } else if (cleaned.length > 10) {
        cleaned = '+' + cleaned
      }
    }
    
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
    return API_KEY && API_KEY !== 'YOUR_GEMINI_API_KEY'
  }

  // Transcribir audio a texto
  async transcribeAudio(base64Audio, retryCount = 0) {
    try {
      console.log('🎤 Transcribiendo audio con Gemini 2.5 Flash...')
      
      // Respetar límites de rate
      await this.waitForRateLimit()
      
      const prompt = `
Transcribe el siguiente audio en español y extrae información relevante sobre problemas técnicos de equipos electrónicos.

INSTRUCCIONES:
1. Transcribe exactamente lo que se dice en el audio
2. Si se mencionan problemas técnicos, organiza la información de manera clara
3. Corrige errores gramaticales menores pero mantén el contenido original
4. Si el audio no es claro, indica qué partes no se pudieron transcribir

FORMATO DE RESPUESTA:
Devuelve solo el texto transcrito sin formato adicional.

Ejemplo de buena transcripción:
"La laptop no enciende cuando presiono el botón de poder. La pantalla permanece negra y no hace ningún sonido. El cargador está conectado pero no parece cargar la batería."
`

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: "audio/webm",
            data: base64Audio
          }
        },
        { text: prompt }
      ])

      const response = await result.response
      const transcription = response.text()
      
      console.log('🎤 Transcripción de Gemini:', transcription)
      
      if (transcription && transcription.trim()) {
        return transcription.trim()
      } else {
        throw new Error('No se pudo transcribir el audio')
      }

    } catch (error) {
      console.error('❌ Error en Gemini transcription:', error)
      
      // Manejo específico de errores de rate limiting
      if (error.message.includes('Quota exceeded') || error.message.includes('429')) {
        if (retryCount < 3) {
          console.log(`🔄 Reintentando transcripción en ${(retryCount + 1) * 3} segundos... (intento ${retryCount + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000))
          return this.transcribeAudio(base64Audio, retryCount + 1)
        } else {
          throw new Error('Límite de cuota excedido. Intenta nuevamente en unos minutos.')
        }
      }
      
      // Error de API key
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        throw new Error('API key de Gemini inválida. Verifica tu configuración.')
      }
      
      throw new Error(`Error transcribiendo audio: ${error.message}`)
    }
  }

  // Obtener información de configuración
  getConfigInfo() {
    return {
      isConfigured: this.isConfigured(),
      model: "gemini-1.5-flash",
      apiKeyStatus: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'No configurada'
    }
  }

  // Método de prueba simple
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Servicio no configurado')
      }

      console.log('🧪 Probando conexión con Gemini...')
      await this.waitForRateLimit()

      const result = await this.model.generateContent('Responde solo "OK" si puedes procesar este mensaje.')
      const response = await result.response
      const text = response.text()

      console.log('✅ Respuesta de Gemini:', text)
      return { success: true, response: text }
    } catch (error) {
      console.error('❌ Error probando Gemini:', error)
      return { success: false, error: error.message }
    }
  }

  // Método para analizar texto simple
  async analyzeText(text, retryCount = 0) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Gemini no está configurado. Agrega tu VITE_GEMINI_API_KEY.')
      }

      console.log('🤖 Analizando texto con Gemini...')
      await this.waitForRateLimit()

      const prompt = `Analiza el siguiente texto y proporciona un resumen útil: "${text}"`
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const analysisText = response.text()

      console.log('📝 Análisis completado:', analysisText)
      return analysisText

    } catch (error) {
      console.error('❌ Error analizando texto:', error)
      
      if (retryCount < 2 && (error.message.includes('quota') || error.message.includes('rate'))) {
        console.log(`🔄 Reintentando análisis de texto (${retryCount + 1}/3)...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        return this.analyzeText(text, retryCount + 1)
      }
      
      throw error
    }
  }
}

// Crear instancia única
const geminiService = new GeminiService()

export default geminiService
export { GeminiService }
