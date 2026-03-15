import { dialog } from 'electron'
import { copyFileSync, statSync, unlinkSync } from 'fs'
import { join, basename, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { db, type MediaRecord } from './database.service'
import { needsConversion, convertToMp4 } from './media-convert.service'

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

export async function importMediaFile(sourcePath: string): Promise<MediaRecord> {
  const id = uuidv4()
  const ext = extname(sourcePath).toLowerCase()
  const title = basename(sourcePath, ext)
  const mediaType = getMediaType(ext)
  const stat = statSync(sourcePath)

  let destPath: string
  let finalExt = ext

  if (mediaType === 'video' && needsConversion(ext)) {
    // Convert non-web-native video to MP4 for Chromium compatibility (e.g. MKV with AC3 audio)
    finalExt = '.mp4'
    destPath = join(db.getMediaDir(), `${id}${finalExt}`)
    try {
      await convertToMp4(sourcePath, destPath)
    } catch (err) {
      console.error('FFmpeg conversion failed, copying original file:', err)
      // Fallback: copy as-is (video may lack sound for unsupported audio codecs)
      destPath = join(db.getMediaDir(), `${id}${ext}`)
      copyFileSync(sourcePath, destPath)
      finalExt = ext
    }
  } else {
    // Web-native format or audio — copy directly
    destPath = join(db.getMediaDir(), `${id}${ext}`)
    copyFileSync(sourcePath, destPath)
  }

  const destStat = statSync(destPath)
  const record: MediaRecord = {
    id,
    title,
    filePath: destPath,
    audioPath: null,
    mediaType,
    durationSeconds: null,
    fileSizeBytes: destStat.size,
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
