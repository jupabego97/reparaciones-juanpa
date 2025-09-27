import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { X, Save, User, Wrench, Phone, Calendar, FileText, AlertCircle, Camera, Image, ArrowLeft, Sparkles, Loader2, Mic, Square } from 'lucide-react'
import openaiService from '../services/openaiService'
import geminiService from '../services/geminiService'
import ToggleSwitch from './ToggleSwitch'
import { toast } from 'react-hot-toast'

const RepairModal = ({ isOpen, onClose, onSubmit, repair, title }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiExtractedInfo, setAiExtractedInfo] = useState(null)
  const [selectedAiModel, setSelectedAiModel] = useState('gemini') // 'gpt4' o 'gemini'
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const fileInputRef = useRef(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger
  } = useForm({
    defaultValues: {
      ownerName: '',
      problemType: '',
      whatsappNumber: '',
      dueDate: '',
      description: '',
      priority: 'normal',
      estimatedCost: 0,
      imageUrl: '',
      hasCharger: false
    }
  })

  const hasCharger = watch('hasCharger')

  // Llenar el formulario si estamos editando
  useEffect(() => {
    if (repair) {
      setValue('ownerName', repair.ownerName)
      setValue('problemType', repair.problemType)
      setValue('whatsappNumber', repair.whatsappNumber)
      setValue('dueDate', repair.dueDate?.split('T')[0]) // Solo la fecha
      setValue('description', repair.description || '')
      setValue('priority', repair.priority || 'normal')
      setValue('estimatedCost', repair.estimatedCost || 0)
      setValue('imageUrl', repair.imageUrl || '')
      setValue('hasCharger', repair.hasCharger || false)
    } else {
      // Para nuevas reparaciones, establecer fecha mínima como mañana
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setValue('dueDate', tomorrow.toISOString().split('T')[0])
    }
  }, [repair, setValue])

  const onFormSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      // Formatear el número de WhatsApp
      let whatsappNumber = data.whatsappNumber.trim()
      if (!whatsappNumber.startsWith('+')) {
        whatsappNumber = '+' + whatsappNumber
      }
      
      const formattedData = {
        ownerName: data.ownerName,
      problemType: data.problemType?.trim() || 'Revisión general',
        whatsappNumber,
        description: data.description || '',
        priority: data.priority || 'normal',
        estimatedCost: parseFloat(data.estimatedCost) || 0,
        dueDate: new Date(data.dueDate).toISOString(),
        imageUrl: imagePreview || data.imageUrl || '',
        hasCharger: data.hasCharger === 'true' || data.hasCharger === true
      }

      await onSubmit(formattedData)
      reset()
      setImagePreview('')
      setSelectedImage(null)
    } catch (error) {
      console.error('Error enviando formulario:', error)
      toast.error(error.message || 'No se pudo guardar la reparación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Detener grabación si está activa
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
    
    reset()
    setImagePreview('')
    setSelectedImage(null)
    setAiExtractedInfo(null)
    setIsTranscribing(false)
    onClose()
  }

  // Funciones para manejo de imágenes con IA
  const handleImageSelect = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
        setValue('imageUrl', e.target.result)
      }
      reader.readAsDataURL(file)

      // Analizar imagen con el modelo seleccionado
      const aiService = selectedAiModel === 'gpt4' ? openaiService : geminiService
      const modelName = selectedAiModel === 'gpt4' ? 'OpenAI GPT-4' : 'Gemini 2.5 Flash'
      
      if (aiService.isConfigured()) {
        await analyzeImageWithAI(file, aiService, modelName)
      } else {
        toast.error(`${modelName} no está configurado. Agrega tu API key en las variables de entorno.`)
      }
    }
  }

  // Analizar imagen con IA (GPT-4 o Gemini)
  const analyzeImageWithAI = async (imageFile, aiService, modelName) => {
    try {
      setIsAnalyzing(true)
      toast.loading(`🤖 Analizando imagen con ${modelName}...`, { id: 'analyzing' })

      const extractedInfo = await aiService.extractEquipmentInfo(imageFile)
      console.log(`🔍 Información extraída por ${modelName}:`, extractedInfo)
      setAiExtractedInfo(extractedInfo)

      // Auto-llenar campos si se encontró información
      if (extractedInfo.nombreCliente && extractedInfo.nombreCliente.trim() !== '') {
        console.log('✅ Llenando campo nombre:', extractedInfo.nombreCliente)
        setValue('ownerName', extractedInfo.nombreCliente.trim(), { 
          shouldValidate: true, 
          shouldDirty: true 
        })
        // Forzar re-render del formulario
        trigger('ownerName')
        toast.success(`✅ Nombre detectado: ${extractedInfo.nombreCliente}`)
      } else {
        console.log('❌ No se encontró nombre del cliente')
      }

      if (extractedInfo.whatsappNumber && extractedInfo.whatsappNumber.trim() !== '') {
        console.log('📱 Llenando campo WhatsApp:', extractedInfo.whatsappNumber)
        setValue('whatsappNumber', extractedInfo.whatsappNumber.trim(), { 
          shouldValidate: true, 
          shouldDirty: true 
        })
        // Forzar re-render del formulario
        trigger('whatsappNumber')
        toast.success(`📱 WhatsApp detectado: ${extractedInfo.whatsappNumber}`)
      } else {
        console.log('❌ No se encontró número de WhatsApp')
      }

      if (extractedInfo.tieneCargador !== undefined) {
        setValue('hasCharger', extractedInfo.tieneCargador)
        toast.success(`🔌 Cargador detectado: ${extractedInfo.tieneCargador ? 'Sí' : 'No'}`)
      }

      // Mostrar información adicional
      if (extractedInfo.tipoEquipo) {
        toast.success(`💻 Equipo detectado: ${extractedInfo.tipoEquipo}`)
      }

      if (extractedInfo.marcaModelo) {
        toast.success(`🏷️ Marca/Modelo: ${extractedInfo.marcaModelo}`)
      }

      toast.dismiss('analyzing')
      toast.success('🎉 Análisis completado. Verifica la información extraída.')

    } catch (error) {
      console.error('Error analizando imagen:', error)
      toast.dismiss('analyzing')
      
      // Mensajes específicos según el tipo de error
      if (error.message.includes('Límite de cuota excedido')) {
        toast.error('⏰ Límite de cuota excedido. Espera unos minutos e intenta nuevamente.', {
          duration: 6000
        })
      } else if (error.message.includes('API key')) {
        toast.error(`🔑 API key de ${modelName} inválida. Verifica tu configuración.`, {
          duration: 6000
        })
      } else if (error.message.includes('créditos') || error.message.includes('credits')) {
        toast.error(`💳 Sin créditos en ${modelName}. Verifica tu facturación.`, {
          duration: 6000
        })
      } else {
        toast.error(`❌ Error analizando imagen: ${error.message}`, {
          duration: 4000
        })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Iniciar grabación de voz
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const audioChunks = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        await transcribeWithGemini(audioBlob)
        
        // Detener todos los tracks del stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      toast.success('🎤 Grabación iniciada. Describe el problema del equipo.')
      
    } catch (error) {
      console.error('Error accediendo al micrófono:', error)
      toast.error('❌ Error accediendo al micrófono. Verifica los permisos.')
    }
  }

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
      toast.loading('🤖 Transcribiendo audio con Gemini...', { id: 'transcribing' })
    }
  }

  // Transcribir audio con Gemini 2.5 Flash
  const transcribeWithGemini = async (audioBlob) => {
    try {
      setIsTranscribing(true)
      
      if (!geminiService.isConfigured()) {
        toast.error('❌ Gemini no está configurado para transcripción.')
        return
      }

      // Convertir audio a base64
      const base64Audio = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(audioBlob)
      })

      // Usar Gemini para transcribir y extraer información
      const transcription = await geminiService.transcribeAudio(base64Audio)
      
      if (transcription && transcription.trim()) {
        // Agregar transcripción al campo descripción
        const currentDescription = watch('description') || ''
        const newDescription = currentDescription 
          ? `${currentDescription} ${transcription}` 
          : transcription
        
        setValue('description', newDescription, { 
          shouldValidate: true, 
          shouldDirty: true 
        })
        trigger('description')
        
        toast.dismiss('transcribing')
        toast.success('✅ Audio transcrito y agregado a la descripción')
      } else {
        toast.dismiss('transcribing')
        toast.error('❌ No se pudo transcribir el audio. Intenta nuevamente.')
      }
      
    } catch (error) {
      console.error('Error transcribiendo audio:', error)
      toast.dismiss('transcribing')
      toast.error(`❌ Error en transcripción: ${error.message}`)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleTakePhoto = () => {
    // En un entorno web, esto abrirá la cámara del dispositivo
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  const handleSelectFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="modal-dark text-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden animate-bounce-in sm:modal-mobile flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold">Nueva Reparación</h2>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Ingrese los detalles de nueva reparación. Una vez creada, se enviará a de notificación por WhatsApp al cliente.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-8">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            
            {/* Botón Tomar Foto del Equipo - Al inicio */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={isAnalyzing}
                className={`w-full text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                  isAnalyzing 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'camera-button hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analizando con IA...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>Tomar Foto del Equipo</span>
                    {((selectedAiModel === 'gpt4' && openaiService.isConfigured()) || 
                      (selectedAiModel === 'gemini' && geminiService.isConfigured())) && (
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    )}
                  </>
                )}
              </button>
            </div>
            
            {/* Nombre del Cliente */}
            <div>
              <label className="block text-white text-sm font-medium mb-2 flex items-center space-x-2">
                <span>Nombre del Cliente</span>
                {aiExtractedInfo?.nombreCliente && (
                  <span className="flex items-center space-x-1 text-green-400 text-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>IA</span>
                  </span>
                )}
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  aiExtractedInfo?.nombreCliente ? 'ring-2 ring-green-400' : ''
                }`}
                placeholder="Juan Pérez"
                {...register('ownerName', {
                  required: 'El nombre del cliente es requerido',
                  minLength: {
                    value: 2,
                    message: 'El nombre debe tener al menos 2 caracteres'
                  }
                })}
              />
              {aiExtractedInfo?.nombreCliente && (
                <p className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Información extraída por IA - Verifica que sea correcta</span>
                </p>
              )}
              {errors.ownerName && (
                <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.ownerName.message}</span>
                </p>
              )}
            </div>

            {/* Número de WhatsApp */}
            <div>
              <label className="block text-white text-sm font-medium mb-2 flex items-center space-x-2">
                <span>Número de WhatsApp</span>
                {aiExtractedInfo?.whatsappNumber && (
                  <span className="flex items-center space-x-1 text-green-400 text-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>IA</span>
                  </span>
                )}
              </label>
              <input
                type="tel"
                className={`w-full px-4 py-3 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  aiExtractedInfo?.whatsappNumber ? 'ring-2 ring-green-400' : ''
                }`}
                placeholder="+57 11XXXXXXX"
                {...register('whatsappNumber', {
                  required: 'El número de WhatsApp es requerido',
                  pattern: {
                    value: /^\+?[1-9]\d{1,14}$/,
                    message: 'Formato inválido. Incluye el código de país'
                  }
                })}
              />
              {aiExtractedInfo?.whatsappNumber && (
                <p className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Número extraído por IA - Verifica que sea correcto</span>
                </p>
              )}
              {errors.whatsappNumber && (
                <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.whatsappNumber.message}</span>
                </p>
              )}
            </div>

            {/* Descripción del Problema */}
            <div>
              <label className="block text-white text-sm font-medium mb-2 flex items-center space-x-2">
                <span>Descripción del Problema</span>
                <span className="flex items-center space-x-1 text-gray-400 text-xs">
                  <User className="w-3 h-3" />
                  <span>Opcional</span>
                </span>
              </label>
              
              {/* Botón de Grabación de Voz */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : isTranscribing
                      ? 'bg-gray-600 cursor-not-allowed text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transcribiendo con Gemini...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span>Detener Grabación</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>🎤 Grabar Descripción del Problema</span>
                      {geminiService.isConfigured() && (
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                      )}
                    </>
                  )}
                </button>
                {isRecording && (
                  <p className="text-red-400 text-xs mt-1 flex items-center space-x-1 animate-pulse">
                    <Mic className="w-3 h-3" />
                    <span>Grabando... Describe el problema del equipo claramente</span>
                  </p>
                )}
                {isTranscribing && (
                  <p className="text-blue-400 text-xs mt-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini está procesando el audio y extrayendo información...</span>
                  </p>
                )}
              </div>

              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 border-2 border-yellow-400"
                placeholder="Ejemplo: No enciende, pantalla rota, lento, etc. Usa el botón de grabación para dictar automáticamente."
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'La descripción no puede tener más de 500 caracteres'
                  }
                })}
              />
              <p className="text-yellow-400 text-xs mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Campo opcional. Escribe manualmente o usa reconocimiento de voz con Gemini.</span>
              </p>
              {errors.description && (
                <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.description.message}</span>
                </p>
              )}
            </div>

            {/* Fecha de Entrega Estimada */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Fecha de Entrega Estimada
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('dueDate', {
                    required: 'La fecha de entrega es requerida',
                    validate: value => {
                      const selectedDate = new Date(value)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return selectedDate >= today || 'La fecha debe ser futura'
                    }
                  })}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.dueDate && (
                <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.dueDate.message}</span>
                </p>
              )}
            </div>

            {/* ¿Trae cargador? */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-white text-sm font-medium">¿Trae cargador?</p>
                    {aiExtractedInfo?.tieneCargador !== undefined && (
                      <span className="flex items-center space-x-1 text-green-400 text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>IA</span>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    {aiExtractedInfo?.tieneCargador !== undefined 
                      ? 'Detectado automáticamente por IA - Verifica que sea correcto'
                      : 'Cantidad de repuesto de equipo.'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={hasCharger === true}
                      onChange={() => setValue('hasCharger', true)}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">Sí</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={hasCharger === false}
                      onChange={() => setValue('hasCharger', false)}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">No</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setValue('hasCharger', !hasCharger)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      hasCharger ? 'bg-blue-500' : 'bg-gray-600'
                    } ${aiExtractedInfo?.tieneCargador !== undefined ? 'ring-2 ring-green-400' : ''}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        hasCharger ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Documentación Visual del Equipo */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-white text-lg font-medium mb-4">Documentación Visual del Equipo</h3>
              
              {/* Selector de Modelo de IA */}
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <label className="block text-white text-sm font-medium mb-3 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>Modelo de IA para Reconocimiento</span>
                </label>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="aiModel"
                      value="gpt4"
                      checked={selectedAiModel === 'gpt4'}
                      onChange={(e) => setSelectedAiModel(e.target.value)}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                    />
                    <div className="text-white">
                      <div className="font-medium">GPT-4 Vision</div>
                      <div className="text-xs text-gray-400">
                        {openaiService.isConfigured() ? '✅ Configurado' : '❌ No configurado'}
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="aiModel"
                      value="gemini"
                      checked={selectedAiModel === 'gemini'}
                      onChange={(e) => setSelectedAiModel(e.target.value)}
                      className="w-4 h-4 text-green-500 focus:ring-green-500 bg-gray-700 border-gray-600"
                    />
                    <div className="text-white">
                      <div className="font-medium">Gemini 2.5 Flash</div>
                      <div className="text-xs text-gray-400">
                        {geminiService.isConfigured() ? '✅ Configurado' : '❌ No configurado'}
                      </div>
                    </div>
                  </label>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  Elige el modelo de IA que analizará la imagen y extraerá la información automáticamente.
                </p>
              </div>
              
              {/* Botón Tomar Foto */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={isAnalyzing}
                className={`w-full text-white py-4 px-6 rounded-lg font-medium mb-3 flex items-center justify-center space-x-2 transition-all duration-200 ${
                  isAnalyzing 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'camera-button hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analizando con IA...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>Tomar Foto del Equipo</span>
                    {((selectedAiModel === 'gpt4' && openaiService.isConfigured()) || 
                      (selectedAiModel === 'gemini' && geminiService.isConfigured())) && (
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    )}
                  </>
                )}
              </button>

              {/* Botón Seleccionar de Galería */}
              <button
                type="button"
                onClick={handleSelectFromGallery}
                disabled={isAnalyzing}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  isAnalyzing 
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Seleccionar de Galería</span>
                {((selectedAiModel === 'gpt4' && openaiService.isConfigured()) || 
                  (selectedAiModel === 'gemini' && geminiService.isConfigured())) && !isAnalyzing && (
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                )}
              </button>

              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Preview de imagen */}
              {imagePreview && (
                <div className="mt-4">
                  <div className="image-preview">
                    <img
                      src={imagePreview}
                      alt="Preview del equipo"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-2 text-center">
                    Vista previa de la imagen seleccionada
                  </p>
                  
                  {/* Resumen de información extraída por IA */}
                  {aiExtractedInfo && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-green-400">
                      <div className="flex items-center space-x-2 mb-3">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Información Extraída por IA</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {aiExtractedInfo.nombreCliente && (
                          <div className="flex justify-between">
                            <span className="text-gray-300">Cliente:</span>
                            <span className="text-white font-medium">{aiExtractedInfo.nombreCliente}</span>
                          </div>
                        )}
                        {aiExtractedInfo.whatsappNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-300">WhatsApp:</span>
                            <span className="text-white font-medium">{aiExtractedInfo.whatsappNumber}</span>
                          </div>
                        )}
                        {aiExtractedInfo.tieneCargador !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-300">Cargador:</span>
                            <span className="text-white font-medium">{aiExtractedInfo.tieneCargador ? 'Sí' : 'No'}</span>
                          </div>
                        )}
                        {aiExtractedInfo.tipoEquipo && (
                          <div className="flex justify-between">
                            <span className="text-gray-300">Tipo:</span>
                            <span className="text-white font-medium">{aiExtractedInfo.tipoEquipo}</span>
                          </div>
                        )}
                        {aiExtractedInfo.marcaModelo && (
                          <div className="flex justify-between">
                            <span className="text-gray-300">Marca/Modelo:</span>
                            <span className="text-white font-medium">{aiExtractedInfo.marcaModelo}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-yellow-400 text-xs mt-3 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Verifica que toda la información sea correcta antes de crear la reparación</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <span>Crea Reparación</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RepairModal
