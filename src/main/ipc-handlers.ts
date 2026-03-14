import { ipcMain } from 'electron'
import { showImportDialog, importMediaFile, deleteMedia } from './services/media-import.service'
import { importSrtDialog, createAutoSegments } from './services/srt-import.service'
import { db } from './services/database.service'

export function registerIpcHandlers(): void {
  // Media handlers
  ipcMain.handle('media:import', async () => {
    return await showImportDialog()
  })

  ipcMain.handle('media:importFile', async (_event, filePath: string) => {
    return importMediaFile(filePath)
  })

  ipcMain.handle('media:list', async () => {
    return db.getMediaList()
  })

  ipcMain.handle('media:getById', async (_event, id: string) => {
    return db.getMediaById(id)
  })

  ipcMain.handle('media:delete', async (_event, id: string) => {
    deleteMedia(id)
  })

  ipcMain.handle('media:update', async (_event, id: string, updates: Record<string, unknown>) => {
    db.updateMedia(id, updates as Parameters<typeof db.updateMedia>[1])
  })

  // Transcript handlers
  ipcMain.handle('transcript:getSegments', async (_event, mediaId: string) => {
    return db.getSegments(mediaId)
  })

  ipcMain.handle(
    'transcript:updateSegment',
    async (_event, segmentId: string, text: string) => {
      db.updateSegment(segmentId, text)
    }
  )

  ipcMain.handle('transcript:importSrt', async (_event, mediaId: string) => {
    return await importSrtDialog(mediaId)
  })

  ipcMain.handle(
    'transcript:autoSegment',
    async (_event, mediaId: string, durationSeconds: number, intervalSeconds: number) => {
      return createAutoSegments(mediaId, durationSeconds, intervalSeconds)
    }
  )

  // Practice handlers
  ipcMain.handle('practice:createSession', async (_event, session) => {
    db.insertSession(session)
    return session
  })

  ipcMain.handle('practice:updateSession', async (_event, id: string, updates) => {
    db.updateSession(id, updates)
  })

  ipcMain.handle('practice:saveResult', async (_event, result) => {
    db.insertResult(result)
  })

  ipcMain.handle('practice:getResults', async (_event, sessionId: string) => {
    return db.getResults(sessionId)
  })

  ipcMain.handle('practice:getResultsByMedia', async (_event, mediaId: string) => {
    return db.getResultsByMedia(mediaId)
  })

  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    return db.getSettings()
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    db.setSetting(key, value)
  })
}
