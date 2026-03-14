import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MediaRecord, TranscriptSegment } from '../../types/media.types'
import { useTranscriptStore } from '../../stores/transcript.store'
import { diffWords } from 'diff'

function DictationPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [media, setMedia] = useState<MediaRecord | null>(null)
  const { segments, currentIndex, setCurrentIndex, nextSegment, prevSegment, fetchSegments } =
    useTranscriptStore()

  const [userInput, setUserInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const segmentAudioRef = useRef<HTMLAudioElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentSegment: TranscriptSegment | undefined = segments[currentIndex]

  useEffect(() => {
    if (!id) return
    window.api.getMediaById(id).then((m) => setMedia(m as MediaRecord | null))
    fetchSegments(id)
  }, [id, fetchSegments])

  const playSegment = (): void => {
    const audio = segmentAudioRef.current
    if (!audio || !currentSegment) return

    audio.currentTime = currentSegment.startTime
    audio.play()

    const handleTimeUpdate = (): void => {
      if (audio.currentTime >= currentSegment.endTime) {
        audio.pause()
        audio.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
    audio.addEventListener('timeupdate', handleTimeUpdate)
  }

  const handleSubmit = (): void => {
    setSubmitted(true)
  }

  const handleNext = (): void => {
    setUserInput('')
    setSubmitted(false)
    setShowAnswer(false)
    nextSegment()
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handlePrev = (): void => {
    setUserInput('')
    setSubmitted(false)
    setShowAnswer(false)
    prevSegment()
  }

  const handleRestart = (): void => {
    setUserInput('')
    setSubmitted(false)
    setShowAnswer(false)
  }

  const renderDiff = (): React.ReactNode => {
    if (!currentSegment) return null
    const changes = diffWords(currentSegment.text.toLowerCase(), userInput.toLowerCase(), {
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
    if (!currentSegment || !userInput.trim()) return 0
    const refWords = currentSegment.text.toLowerCase().split(/\s+/)
    const userWords = userInput.toLowerCase().split(/\s+/)
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
      <audio ref={segmentAudioRef} src={`media://${media.filePath}`} preload="auto" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          ← 返回
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">听写练习</h1>
          <p className="text-sm text-gray-500">{media.title}</p>
        </div>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {segments.length}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / segments.length) * 100}%` }}
        />
      </div>

      {/* Practice area */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        {/* Play button */}
        <div className="text-center mb-6">
          <button
            onClick={playSegment}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            ▶ 播放片段
          </button>
          <p className="text-xs text-gray-400 mt-2">听完后在下方输入你听到的内容</p>
        </div>

        {!submitted ? (
          <>
            {/* Input area */}
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入你听到的英文..."
              className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (userInput.trim()) handleSubmit()
                }
              }}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                提交
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">对比结果</h3>
              {renderDiff()}
            </div>

            {showAnswer && (
              <div className="mb-6 p-4 bg-green-50 rounded-xl">
                <h3 className="text-sm font-medium text-green-700 mb-1">正确答案</h3>
                <p className="text-green-900">{currentSegment?.text}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showAnswer ? '隐藏答案' : '显示答案'}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">准确率:</span>
                <span
                  className={`text-xl font-bold ${
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
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300"
        >
          ← 上一句
        </button>

        <div className="flex gap-3">
          {submitted && (
            <>
              <button
                onClick={handleRestart}
                className="text-sm text-purple-600 hover:text-purple-700 px-4 py-2"
              >
                重新听写
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= segments.length - 1}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                下一句 →
              </button>
            </>
          )}
        </div>

        <span className="text-xs text-gray-400">
          {currentIndex + 1}/{segments.length}
        </span>
      </div>
    </div>
  )
}

export default DictationPage
