import { create } from 'zustand'
import type { TranscriptSegment } from '../types/media.types'

interface TranscriptStore {
  segments: TranscriptSegment[]
  currentIndex: number
  loading: boolean

  fetchSegments: (mediaId: string) => Promise<void>
  setCurrentIndex: (index: number) => void
  nextSegment: () => void
  prevSegment: () => void
  updateSegmentText: (segmentId: string, text: string) => Promise<void>
  clear: () => void
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
  segments: [],
  currentIndex: 0,
  loading: false,

  fetchSegments: async (mediaId: string) => {
    set({ loading: true })
    try {
      const segments = (await window.api.getSegments(mediaId)) as TranscriptSegment[]
      set({ segments, currentIndex: 0, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setCurrentIndex: (index: number) => {
    const { segments } = get()
    if (index >= 0 && index < segments.length) {
      set({ currentIndex: index })
    }
  },

  nextSegment: () => {
    const { currentIndex, segments } = get()
    if (currentIndex < segments.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  prevSegment: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  updateSegmentText: async (segmentId: string, text: string) => {
    await window.api.updateSegment(segmentId, text)
    set((state) => ({
      segments: state.segments.map((s) => (s.id === segmentId ? { ...s, text, isUserEdited: true } : s))
    }))
  },

  clear: () => set({ segments: [], currentIndex: 0 })
}))
