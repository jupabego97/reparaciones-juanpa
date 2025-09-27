import React, { useState, useEffect } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import geminiService from '../services/geminiService'
import { toast } from 'react-hot-toast'

const GeminiTest = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [configInfo, setConfigInfo] = useState({})
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState(null)
  const [testText, setTestText] = useState('Este es un equipo laptop HP con problemas de pantalla')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')

  useEffect(() => {
    // Verificar configuración al cargar
    const configured = geminiService.isConfigured()
    const info = geminiService.getConfigInfo()
    
    setIsConfigured(configured)
    setConfigInfo(info)
    
    if (!configured) {
      toast.error('Gemini no está configurado. Necesitas agregar VITE_GEMINI_API_KEY')
    } else {
      toast.success('Gemini está configurado correctamente')
    }
  }, [])

  const testConnection = async () => {
    if (!isConfigured) {
      toast.error('Configura Gemini primero')
      return
    }

    setIsTestingConnection(true)
    setConnectionResult(null)

    try {
      const result = await geminiService.testConnection()
      setConnectionResult(result)
      
      if (result.success) {
        toast.success('Conexión con Gemini exitosa!')
      } else {
        toast.error(`Error de conexión: ${result.error}`)
      }
    } catch (error) {
      const errorResult = { success: false, error: error.message }
      setConnectionResult(errorResult)
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const analyzeText = async () => {
    if (!isConfigured) {
      toast.error('Configura Gemini primero')
      return
    }

    if (!testText.trim()) {
      toast.error('Ingresa texto para analizar')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult('')

    try {
      const result = await geminiService.analyzeText(testText)
      setAnalysisResult(result)
      toast.success('Análisis completado')
    } catch (error) {
      toast.error(`Error en análisis: ${error.message}`)
      setAnalysisResult(`Error: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <Sparkles className="w-8 h-8 text-purple-500" />
        <h2 className="text-2xl font-bold text-gray-900">Pruebas de Gemini AI</h2>
      </div>

      {/* Estado de configuración */}
      <div className="mb-6 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          {isConfigured ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <X className="w-5 h-5 text-red-500" />
          )}
          <span>Estado de configuración</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Estado:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              isConfigured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConfigured ? 'Configurado' : 'No configurado'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Modelo:</span>
            <span className="ml-2 text-gray-600">{configInfo.model}</span>
          </div>
          
          <div>
            <span className="font-medium">API Key:</span>
            <span className="ml-2 text-gray-600 font-mono text-xs">
              {configInfo.apiKeyStatus}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Para configurar Gemini:</strong>
            </p>
            <ol className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>1. Crea un archivo <code>.env</code> en <code>reparaciones-juanpa/frontend/</code></li>
              <li>2. Agrega: <code>VITE_GEMINI_API_KEY=tu_api_key_aqui</code></li>
              <li>3. Obtén tu API key en: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
              <li>4. Reinicia el servidor de desarrollo</li>
            </ol>
          </div>
        )}
      </div>

      {/* Prueba de conexión */}
      <div className="mb-6 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3">Prueba de conexión</h3>
        
        <button
          onClick={testConnection}
          disabled={!isConfigured || isTestingConnection}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            isConfigured
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isTestingConnection ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {isTestingConnection ? 'Probando conexión...' : 'Probar conexión'}
          </span>
        </button>

        {connectionResult && (
          <div className={`mt-3 p-3 rounded border ${
            connectionResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="font-medium">
              {connectionResult.success ? '✅ Conexión exitosa' : '❌ Error de conexión'}
            </div>
            <div className="text-sm mt-1">
              {connectionResult.success 
                ? `Respuesta: ${connectionResult.response}`
                : `Error: ${connectionResult.error}`
              }
            </div>
          </div>
        )}
      </div>

      {/* Prueba de análisis de texto */}
      <div className="mb-6 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3">Análisis de texto</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto para analizar:
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Ingresa texto para que Gemini lo analice..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            onClick={analyzeText}
            disabled={!isConfigured || isAnalyzing || !testText.trim()}
            className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
              isConfigured && testText.trim()
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isAnalyzing ? 'Analizando...' : 'Analizar con Gemini'}
            </span>
          </button>

          {analysisResult && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="font-medium text-gray-700 mb-2">Resultado del análisis:</div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GeminiTest
