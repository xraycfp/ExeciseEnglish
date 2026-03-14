import { create } from 'zustand'
import type { MediaRecord } from '../types/media.types'

interface MediaStore {
  mediaList: MediaRecord[]
  loading: boolean
  error: string | null

  fetchMediaList: () => Promise<void>
  importMedia: () => Promise<MediaRecord | null>
  deleteMedia: (id: string) => Promise<void>
}

export const useMediaStore = create<MediaStore>((set) => ({
  mediaList: [],
  loading: false,
  error: null,

  fetchMediaList: async () => {
    set({ loading: true, error: null })
    try {
      const list = (await window.api.getMediaList()) as MediaRecord[]
      set({ mediaList: list, loading: false })
    } catch (err) {
      set({ error: String(err), loading: false })
    }
  },

  importMedia: async () => {
    try {
      const record = (await window.api.importMedia()) as MediaRecord | null
      if (record) {
        set((state) => ({ mediaList: [record, ...state.mediaList] }))
      }
      return record
    } catch (err) {
      set({ error: String(err) })
      return null
    }
  },

  deleteMedia: async (id: string) => {
    try {
      await window.api.deleteMedia(id)
      set((state) => ({
        mediaList: state.mediaList.filter((m) => m.id !== id)
      }))
    } catch (err) {
      set({ error: String(err) })
    }
  }
}))
