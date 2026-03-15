import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MediaRecord, TranscriptSegment } from '../types/media.types'
import { useTranscriptStore } from '../stores/transcript.store'
import VideoPlayer, { type VideoPlayerHandle } from '../components/media/VideoPlayer'
import AudioPlayer, { type AudioPlayerHandle } from '../components/media/AudioPlayer'
import SegmentList from '../components/transcript/SegmentList'

const SAVE_INTERVAL = 3000 // save playback position every 3 seconds

function MediaDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [media, setMedia] = useState<MediaRecord | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [importing, setImporting] = useState(false)
  const { segments, currentIndex, setCurrentIndex, fetchSegments } = useTranscriptStore()

  const videoRef = useRef<VideoPlayerHandle>(null)
  const audioRef = useRef<AudioPlayerHandle>(null)
  const currentTimeRef = useRef(0)

  // Keep ref in sync for use in interval/cleanup callbacks
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
    currentTimeRef.current = time
  }, [])

  useEffect(() => {
    if (!id) return
    window.api.getMediaById(id).then((m) => {
      setMedia(m as MediaRecord | null)
    })
    fetchSegments(id)
  }, [id, fetchSegments])

  // Periodically save playback position
  useEffect(() => {
    if (!id) return
    const interval = setInterval(() => {
      if (currentTimeRef.current > 0) {
        window.api.updateMedia(id, { lastPlaybackPosition: currentTimeRef.current })
      }
    }, SAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [id])

  // Save position on unmount (leaving the page)
  useEffect(() => {
    return () => {
      if (id && currentTimeRef.current > 0) {
        window.api.updateMedia(id, { lastPlaybackPosition: currentTimeRef.current })
      }
    }
  }, [id])

  const playerRef = media?.mediaType === 'video' ? videoRef : audioRef

  const handleSegmentClick = (index: number): void => {
    setCurrentIndex(index)
    const seg = segments[index]
    if (seg && playerRef.current) {
      playerRef.current.playSegment(seg.startTime, seg.endTime)
    }
  }

  const handleDurationChange = useCallback((d: number) => {
    setDuration(d)
  }, [])

  const handleImportSrt = async (): Promise<void> => {
    if (!id) return
    setImporting(true)
    try {
      const result = (await window.api.importSrt(id)) as TranscriptSegment[]
      if (result.length > 0) {
        await fetchSegments(id)
      }
    } finally {
      setImporting(false)
    }
  }

  const handleAutoSegment = async (): Promise<void> => {
    if (!id || duration <= 0) return
    setImporting(true)
    try {
      await window.api.autoSegment(id, duration, 10)
      await fetchSegments(id)
    } finally {
      setImporting(false)
    }
  }

  if (!media) {
    return <div className="p-8 text-gray-400">加载中...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{media.title}</h1>
          <p className="text-sm text-gray-500">
            {media.mediaType === 'video' ? '视频' : '音频'}
            {' · '}
            {(media.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
            {duration > 0 && ` · ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player area */}
        <div className="lg:col-span-2 space-y-4">
          {media.mediaType === 'video' ? (
            <VideoPlayer
              ref={videoRef}
              src={media.filePath}
              initialTime={media.lastPlaybackPosition ?? undefined}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              className="aspect-video"
            />
          ) : (
            <AudioPlayer
              ref={audioRef}
              src={media.filePath}
              initialTime={media.lastPlaybackPosition ?? undefined}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
            />
          )}

          {/* Practice buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/practice/echo/${media.id}`)}
              disabled={segments.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              回音练习
            </button>
            <button
              onClick={() => navigate(`/practice/dictation/${media.id}`)}
              disabled={segments.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              听写练习
            </button>
          </div>
        </div>

        {/* Transcript panel */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">转录文本</h2>
            <span className="text-xs text-gray-400">
              {segments.length > 0 ? `${segments.length} 个片段` : ''}
            </span>
          </div>

          {segments.length > 0 ? (
            <>
              <SegmentList
                segments={segments}
                currentIndex={currentIndex}
                activeTime={currentTime}
                onSegmentClick={handleSegmentClick}
              />
              {/* Re-import option */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={handleImportSrt}
                  disabled={importing}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  重新导入字幕
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-gray-400">暂无转录文本</p>
              <div className="space-y-2">
                <button
                  onClick={handleImportSrt}
                  disabled={importing}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {importing ? '导入中...' : '导入 SRT 字幕文件'}
                </button>
                <button
                  onClick={handleAutoSegment}
                  disabled={importing || duration <= 0}
                  className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm transition-colors"
                >
                  按时间自动分段（每10秒）
                </button>
              </div>
              <p className="text-xs text-gray-400">
                支持 .srt 字幕文件格式
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaDetailPage
