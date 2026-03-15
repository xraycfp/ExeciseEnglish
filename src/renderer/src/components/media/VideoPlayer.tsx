import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

interface VideoPlayerProps {
  src: string
  initialTime?: number
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  onEnded?: () => void
  className?: string
}

export interface VideoPlayerHandle {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  playSegment: (startTime: number, endTime: number) => void
  getCurrentTime: () => number
  getDuration: () => number
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src, initialTime, onTimeUpdate, onDurationChange, onEnded, className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const segmentEndRef = useRef<number | null>(null)
    const initialTimeApplied = useRef(false)

    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = time
      },
      playSegment: (startTime: number, endTime: number) => {
        if (!videoRef.current) return
        videoRef.current.currentTime = startTime
        segmentEndRef.current = endTime
        videoRef.current.play()
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      getDuration: () => videoRef.current?.duration ?? 0
    }))

    const handleTimeUpdate = useCallback(() => {
      const video = videoRef.current
      if (!video) return

      onTimeUpdate?.(video.currentTime)

      if (segmentEndRef.current !== null && video.currentTime >= segmentEndRef.current) {
        video.pause()
        segmentEndRef.current = null
        onEnded?.()
      }
    }, [onTimeUpdate, onEnded])

    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      video.addEventListener('timeupdate', handleTimeUpdate)
      return () => video.removeEventListener('timeupdate', handleTimeUpdate)
    }, [handleTimeUpdate])

    // Restore initial playback position once the element is seekable
    useEffect(() => {
      const video = videoRef.current
      if (!video || !initialTime || initialTime <= 0 || initialTimeApplied.current) return

      const doSeek = (): void => {
        if (initialTimeApplied.current) return
        video.currentTime = initialTime
        initialTimeApplied.current = true
      }

      // Already loaded enough data to seek
      if (video.readyState >= 2) {
        doSeek()
        return
      }

      video.addEventListener('loadeddata', doSeek)
      return () => video.removeEventListener('loadeddata', doSeek)
    }, [initialTime])

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          src={`media://${src}`}
          className="w-full h-full"
          controls
          onDurationChange={(e) => onDurationChange?.(e.currentTarget.duration)}
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer
