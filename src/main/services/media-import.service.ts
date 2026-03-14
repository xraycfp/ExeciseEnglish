import { dialog } from 'electron'
import { copyFileSync, statSync } from 'fs'
import { join, basename, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { db, type MediaRecord } from './database.service'

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv']
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma']
const ALL_EXTENSIONS = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS]

function getMediaType(ext: string): 'video' | 'audio' {
  return VIDEO_EXTENSIONS.includes(ext.toLowerCase()) ? 'video' : 'audio'
}

export async function showImportDialog(): Promise<MediaRecord | null> {
  const result = await dialog.showOpenDialog({
    title: '导入媒体文件',
    filters: [
      {
        name: '媒体文件',
        extensions: ALL_EXTENSIONS.map((e) => e.slice(1))
      },
      {
        name: '视频文件',
        extensions: VIDEO_EXTENSIONS.map((e) => e.slice(1))
      },
      {
        name: '音频文件',
        extensions: AUDIO_EXTENSIONS.map((e) => e.slice(1))
      }
    ],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return importMediaFile(result.filePaths[0])
}

export function importMediaFile(sourcePath: string): MediaRecord {
  const id = uuidv4()
  const ext = extname(sourcePath).toLowerCase()
  const title = basename(sourcePath, ext)
  const mediaType = getMediaType(ext)
  const stat = statSync(sourcePath)

  // Copy file to app media directory
  const destFileName = `${id}${ext}`
  const destPath = join(db.getMediaDir(), destFileName)
  copyFileSync(sourcePath, destPath)

  const record: MediaRecord = {
    id,
    title,
    filePath: destPath,
    audioPath: null,
    mediaType,
    durationSeconds: null,
    fileSizeBytes: stat.size,
    importedAt: new Date().toISOString(),
    transcriptionStatus: 'pending',
    thumbnailPath: null
  }

  db.insertMedia(record)
  return record
}

export function deleteMedia(id: string): void {
  const media = db.getMediaById(id)
  if (media) {
    // Remove files
    try {
      const { unlinkSync } = require('fs')
      if (media.filePath) unlinkSync(media.filePath)
      if (media.audioPath) unlinkSync(media.audioPath)
      if (media.thumbnailPath) unlinkSync(media.thumbnailPath)
    } catch {
      // file might already be deleted
    }
    db.deleteMedia(id)
  }
}
