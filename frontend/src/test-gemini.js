// Script de prueba para verificar el servicio de Gemini
import geminiService from './services/geminiService.js'

console.log('🧪 Probando servicio de Gemini...')

// Verificar configuración
const isConfigured = geminiService.isConfigured()
console.log('✅ Gemini configurado:', isConfigured)

if (isConfigured) {
  console.log('📋 Info de configuración:', geminiService.getConfigInfo())
} else {
  console.log('⚠️  Gemini no configurado. Necesitas agregar VITE_GEMINI_API_KEY en tu archivo .env')
}

// Función para probar análisis de texto
async function testTextAnalysis() {
  try {
    console.log('🔍 Probando análisis de texto...')
    
    const testPrompt = "Hola, soy un equipo laptop HP con problema de pantalla"
    const response = await geminiService.analyzeText(testPrompt)
    
    console.log('📝 Respuesta de análisis:', response)
  } catch (error) {
    console.error('❌ Error en análisis de texto:', error)
  }
}

// Función para probar transcripción (simulada)
async function testTranscription() {
  try {
    console.log('🎤 Probando transcripción simulada...')
    
    // Crear un blob de audio simulado (en realidad texto)
    const fakeAudioBase64 = 'dGVzdCBhdWRpbw==' // "test audio" en base64
    
    const transcription = await geminiService.transcribeAudio(fakeAudioBase64)
    
    console.log('🎵 Transcripción:', transcription)
  } catch (error) {
    console.error('❌ Error en transcripción:', error)
  }
}

// Ejecutar pruebas si está configurado
if (isConfigured) {
  testTextAnalysis()
  testTranscription()
} else {
  console.log('💡 Para probar Gemini:')
  console.log('1. Crea un archivo .env en reparaciones-juanpa/frontend/')
  console.log('2. Agrega: VITE_GEMINI_API_KEY=tu_api_key_aqui')
  console.log('3. Obtén tu API key en: https://makersuite.google.com/app/apikey')
  console.log('4. Reinicia el servidor de desarrollo')
}
