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
  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {segments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">暂无转录文本</p>
      ) : (
        segments.map((seg, idx) => {
          const isActive =
            activeTime !== undefined && activeTime >= seg.startTime && activeTime < seg.endTime
          const isCurrent = idx === currentIndex

          return (
            <button
              key={seg.id}
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
