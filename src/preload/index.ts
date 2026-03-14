import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Media
  importMedia: (): Promise<unknown> => ipcRenderer.invoke('media:import'),
  importMediaFile: (filePath: string): Promise<unknown> =>
    ipcRenderer.invoke('media:importFile', filePath),
  getMediaList: (): Promise<unknown[]> => ipcRenderer.invoke('media:list'),
  getMediaById: (id: string): Promise<unknown> => ipcRenderer.invoke('media:getById', id),
  deleteMedia: (id: string): Promise<void> => ipcRenderer.invoke('media:delete', id),
  updateMedia: (id: string, updates: Record<string, unknown>): Promise<void> =>
    ipcRenderer.invoke('media:update', id, updates),

  // Transcript
  getSegments: (mediaId: string): Promise<unknown[]> =>
    ipcRenderer.invoke('transcript:getSegments', mediaId),
  updateSegment: (segmentId: string, text: string): Promise<void> =>
    ipcRenderer.invoke('transcript:updateSegment', segmentId, text),
  importSrt: (mediaId: string): Promise<unknown[]> =>
    ipcRenderer.invoke('transcript:importSrt', mediaId),
  autoSegment: (mediaId: string, durationSeconds: number, intervalSeconds: number): Promise<unknown[]> =>
    ipcRenderer.invoke('transcript:autoSegment', mediaId, durationSeconds, intervalSeconds),

  // Practice
  createSession: (session: unknown): Promise<unknown> =>
    ipcRenderer.invoke('practice:createSession', session),
  updateSession: (id: string, updates: unknown): Promise<void> =>
    ipcRenderer.invoke('practice:updateSession', id, updates),
  saveResult: (result: unknown): Promise<void> =>
    ipcRenderer.invoke('practice:saveResult', result),
  getResults: (sessionId: string): Promise<unknown[]> =>
    ipcRenderer.invoke('practice:getResults', sessionId),
  getResultsByMedia: (mediaId: string): Promise<unknown[]> =>
    ipcRenderer.invoke('practice:getResultsByMedia', mediaId),

  // Settings
  getSettings: (): Promise<Record<string, string>> => ipcRenderer.invoke('settings:get'),
  setSetting: (key: string, value: string): Promise<void> =>
    ipcRenderer.invoke('settings:set', key, value)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
