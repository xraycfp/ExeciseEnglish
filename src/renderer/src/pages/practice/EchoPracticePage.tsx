import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MediaRecord, TranscriptSegment } from '../../types/media.types'
import { useTranscriptStore } from '../../stores/transcript.store'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { diffWords } from 'diff'

type EchoStep = 'listen' | 'echo' | 'record' | 'compare'

function EchoPracticePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [media, setMedia] = useState<MediaRecord | null>(null)
  const { segments, currentIndex, setCurrentIndex, nextSegment, prevSegment, fetchSegments } =
    useTranscriptStore()
  const { isRecording, audioUrl, startRecording, stopRecording, clearRecording } =
    useAudioRecorder()
  const { transcript, interimTranscript, isListening, startListening, stopListening, resetTranscript } =
    useSpeechRecognition()

  const [step, setStep] = useState<EchoStep>('listen')
  const [echoPauseSeconds, setEchoPauseSeconds] = useState(3)
  const [echoCountdown, setEchoCountdown] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const segmentAudioRef = useRef<HTMLAudioElement>(null)

  const currentSegment: TranscriptSegment | undefined = segments[currentIndex]

  useEffect(() => {
    if (!id) return
    window.api.getMediaById(id).then((m) => setMedia(m as MediaRecord | null))
    fetchSegments(id)
    window.api.getSettings().then((s) => {
      if (s['echoPauseSeconds']) setEchoPauseSeconds(Number(s['echoPauseSeconds']))
    })
  }, [id, fetchSegments])

  // Play current segment
  const playSegment = (): void => {
    const audio = segmentAudioRef.current
    if (!audio || !currentSegment || !media) return

    audio.currentTime = currentSegment.startTime
    audio.play()

    const handleTimeUpdate = (): void => {
      if (audio.currentTime >= currentSegment.endTime) {
        audio.pause()
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        startEchoPause()
      }
    }
    audio.addEventListener('timeupdate', handleTimeUpdate)
  }

  // Echo pause countdown
  const startEchoPause = (): void => {
    setStep('echo')
    setEchoCountdown(echoPauseSeconds)

    let remaining = echoPauseSeconds
    const interval = setInterval(() => {
      remaining -= 1
      setEchoCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        setStep('record')
        handleStartRecording()
      }
    }, 1000)
  }

  const handleStartRecording = async (): Promise<void> => {
    resetTranscript()
    await startRecording()
    startListening()
  }

  const handleStopRecording = async (): Promise<void> => {
    await stopRecording()
    stopListening()
    setStep('compare')
  }

  const handleNext = (): void => {
    clearRecording()
    resetTranscript()
    setStep('listen')
    nextSegment()
  }

  const handlePrev = (): void => {
    clearRecording()
    resetTranscript()
    setStep('listen')
    prevSegment()
  }

  const handleRestart = (): void => {
    clearRecording()
    resetTranscript()
    setStep('listen')
  }

  // Word diff between reference and user transcript
  const renderDiff = (): React.ReactNode => {
    if (!currentSegment || !transcript) return null
    const changes = diffWords(currentSegment.text.toLowerCase(), transcript.toLowerCase(), {
      ignoreCase: true
    })
    return (
      <div className="flex flex-wrap gap-1 text-lg">
        {changes.map((part, i) => (
          <span
            key={i}
            className={
              part.added
                ? 'bg-red-100 text-red-700 px-1 rounded line-through'
                : part.removed
                  ? 'bg-yellow-100 text-yellow-700 px-1 rounded'
                  : 'text-green-700'
            }
          >
            {part.value}
          </span>
        ))}
      </div>
    )
  }

  const calculateAccuracy = (): number => {
    if (!currentSegment || !transcript) return 0
    const refWords = currentSegment.text.toLowerCase().split(/\s+/)
    const userWords = transcript.toLowerCase().split(/\s+/)
    let match = 0
    for (const word of refWords) {
      if (userWords.includes(word)) match++
    }
    return Math.round((match / refWords.length) * 100)
  }

  if (!media || segments.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">
          {!media ? '加载中...' : '没有可用的转录片段'}
        </p>
        <button onClick={() => navigate(-1)} className="text-primary-600 text-sm">
          ← 返回
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Hidden audio element for segment playback */}
      <audio ref={segmentAudioRef} src={`media://${media.filePath}`} preload="auto" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          ← 返回
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">回音练习</h1>
          <p className="text-sm text-gray-500">{media.title}</p>
        </div>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {segments.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / segments.length) * 100}%` }}
        />
      </div>

      {/* Main practice area */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['listen', 'echo', 'record', 'compare'].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                step === s
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {s === 'listen' && '1. 听'}
              {s === 'echo' && '2. 回音'}
              {s === 'record' && '3. 模仿'}
              {s === 'compare' && '4. 对比'}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 'listen' && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-6">点击播放，仔细聆听这个片段</p>
            <button
              onClick={playSegment}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
            >
              ▶ 播放片段
            </button>
          </div>
        )}

        {step === 'echo' && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">在心中回放刚才听到的声音...</p>
            <div className="text-6xl font-bold text-blue-500 mb-4">{echoCountdown}</div>
            <p className="text-sm text-gray-400">
              即将开始录音，请准备好模仿
            </p>
          </div>
        )}

        {step === 'record' && (
          <div className="text-center py-8">
            <div className="mb-6">
              {isRecording && (
                <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm">录音中...</span>
                </div>
              )}
              {isListening && interimTranscript && (
                <p className="text-gray-400 text-sm italic">{interimTranscript}</p>
              )}
            </div>
            <p className="text-gray-500 mb-6">模仿刚才听到的发音和语调</p>
            <button
              onClick={handleStopRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
            >
              ■ 停止录音
            </button>
          </div>
        )}

        {step === 'compare' && (
          <div className="py-4">
            {/* Original text */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">原文</h3>
              <p className="text-lg text-gray-900">{currentSegment?.text}</p>
            </div>

            {/* User transcript */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">你的发音</h3>
              {transcript ? (
                renderDiff()
              ) : (
                <p className="text-gray-400 italic">未识别到语音</p>
              )}
            </div>

            {/* Accuracy */}
            {transcript && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">准确率</span>
                  <span
                    className={`text-2xl font-bold ${
                      calculateAccuracy() >= 80
                        ? 'text-green-600'
                        : calculateAccuracy() >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {calculateAccuracy()}%
                  </span>
                </div>
              </div>
            )}

            {/* Audio comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">原始音频</h3>
                <button
                  onClick={playSegment}
                  className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg text-sm transition-colors"
                >
                  ▶ 再听一遍
                </button>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">我的录音</h3>
                {audioUrl ? (
                  <audio ref={audioRef} src={audioUrl} controls className="w-full h-10" />
                ) : (
                  <p className="text-gray-400 text-sm text-center py-3">无录音</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          ← 上一句
        </button>

        <div className="flex gap-3">
          {step === 'compare' && (
            <button
              onClick={handleRestart}
              className="text-sm text-blue-600 hover:text-blue-700 px-4 py-2"
            >
              重新练习
            </button>
          )}
          {step === 'compare' && (
            <button
              onClick={handleNext}
              disabled={currentIndex >= segments.length - 1}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              下一句 →
            </button>
          )}
        </div>

        <span className="text-xs text-gray-400">
          {currentIndex + 1}/{segments.length}
        </span>
      </div>
    </div>
  )
}

export default EchoPracticePage
