import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

interface AudioPlayerProps {
  src: string
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  onEnded?: () => void
  className?: string
}

export interface AudioPlayerHandle {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  playSegment: (startTime: number, endTime: number) => void
  getCurrentTime: () => number
  getDuration: () => number
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  ({ src, onTimeUpdate, onDurationChange, onEnded, className = '' }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const segmentEndRef = useRef<number | null>(null)

    useImperativeHandle(ref, () => ({
      play: () => audioRef.current?.play(),
      pause: () => audioRef.current?.pause(),
      seek: (time: number) => {
        if (audioRef.current) audioRef.current.currentTime = time
      },
      playSegment: (startTime: number, endTime: number) => {
        if (!audioRef.current) return
        audioRef.current.currentTime = startTime
        segmentEndRef.current = endTime
        audioRef.current.play()
      },
      getCurrentTime: () => audioRef.current?.currentTime ?? 0,
      getDuration: () => audioRef.current?.duration ?? 0
    }))

    const handleTimeUpdate = useCallback(() => {
      const audio = audioRef.current
      if (!audio) return

      onTimeUpdate?.(audio.currentTime)

      if (segmentEndRef.current !== null && audio.currentTime >= segmentEndRef.current) {
        audio.pause()
        segmentEndRef.current = null
        onEnded?.()
      }
    }, [onTimeUpdate, onEnded])

    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      audio.addEventListener('timeupdate', handleTimeUpdate)
      return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
    }, [handleTimeUpdate])

    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <audio
          ref={audioRef}
          src={`media://${src}`}
          className="w-full"
          controls
          onDurationChange={(e) => onDurationChange?.(e.currentTarget.duration)}
        />
      </div>
    )
  }
)

AudioPlayer.displayName = 'AudioPlayer'
export default AudioPlayer
