import { useRef, useEffect, useCallback } from 'react'
import type { TranscriptSegment } from '../../types/media.types'

interface SegmentListProps {
  segments: TranscriptSegment[]
  currentIndex: number
  activeTime?: number
  onSegmentClick: (index: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SegmentList({
  segments,
  currentIndex,
  activeTime,
  onSegmentClick
}: SegmentListProps): React.ReactElement {
  const activeRef = useRef<HTMLButtonElement>(null)
  const lastActiveIndexRef = useRef<number>(-1)

  // Find the currently active segment index based on playback time
  const activeIndex = segments.findIndex(
    (seg) => activeTime !== undefined && activeTime >= seg.startTime && activeTime < seg.endTime
  )

  // Auto-scroll when active segment changes
  useEffect(() => {
    if (activeIndex >= 0 && activeIndex !== lastActiveIndexRef.current) {
      lastActiveIndexRef.current = activeIndex
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex])

  const setActiveRef = useCallback(
    (idx: number) => (el: HTMLButtonElement | null) => {
      if (idx === activeIndex) activeRef.current = el
    },
    [activeIndex]
  )

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {segments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">暂无转录文本</p>
      ) : (
        segments.map((seg, idx) => {
          const isActive = idx === activeIndex
          const isCurrent = idx === currentIndex

          return (
            <button
              key={seg.id}
              ref={setActiveRef(idx)}
              onClick={() => onSegmentClick(idx)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isCurrent
                  ? 'bg-primary-50 border border-primary-200 text-primary-800'
                  : isActive
                    ? 'bg-blue-50 text-blue-800'
                    : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono shrink-0">
                  {formatTime(seg.startTime)}
                </span>
                <span className="flex-1">{seg.text}</span>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}

export default SegmentList
