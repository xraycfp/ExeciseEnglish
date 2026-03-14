import { useState, useRef, useCallback } from 'react'

interface UseSpeechRecognitionReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  confidence: number
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  isSupported: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [confidence, setConfidence] = useState(0)

  const recognitionRef = useRef<SpeechRecognitionType>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const isSupported = !!SpeechRecognition

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionType) => {
      let final = ''
      let interim = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
          setConfidence(result[0].confidence)
        } else {
          interim += result[0].transcript
        }
      }

      if (final) setTranscript(final)
      setInterimTranscript(interim)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setTranscript('')
    setInterimTranscript('')
  }, [SpeechRecognition])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
  }, [])

  return {
    transcript,
    interimTranscript,
    isListening,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  }
}
