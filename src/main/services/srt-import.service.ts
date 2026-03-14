import { dialog } from 'electron'
import { readFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { db, type TranscriptSegment } from './database.service'

interface SrtEntry {
  index: number
  startTime: number
  endTime: number
  text: string
}

function parseTimestamp(ts: string): number {
  // Format: 00:01:23,456 or 00:01:23.456
  const parts = ts.trim().replace(',', '.').split(':')
  const hours = parseFloat(parts[0])
  const minutes = parseFloat(parts[1])
  const seconds = parseFloat(parts[2])
  return hours * 3600 + minutes * 60 + seconds
}

function parseSrt(content: string): SrtEntry[] {
  const entries: SrtEntry[] = []
  // Normalize line endings
  const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n\n+/)

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length < 3) continue

    const index = parseInt(lines[0], 10)
    if (isNaN(index)) continue

    const timeLine = lines[1]
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/
    )
    if (!timeMatch) continue

    const startTime = parseTimestamp(timeMatch[1])
    const endTime = parseTimestamp(timeMatch[2])
    const text = lines.slice(2).join(' ').replace(/<[^>]*>/g, '').trim()

    if (text) {
      entries.push({ index, startTime, endTime, text })
    }
  }

  return entries
}

export async function importSrtDialog(mediaId: string): Promise<TranscriptSegment[]> {
  const result = await dialog.showOpenDialog({
    title: '导入字幕文件',
    filters: [
      { name: '字幕文件', extensions: ['srt', 'txt'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  return importSrtFile(mediaId, result.filePaths[0])
}

export function importSrtFile(mediaId: string, filePath: string): TranscriptSegment[] {
  const content = readFileSync(filePath, 'utf-8')
  const entries = parseSrt(content)

  const segments: TranscriptSegment[] = entries.map((entry, idx) => ({
    id: uuidv4(),
    mediaId,
    segmentIndex: idx,
    startTime: entry.startTime,
    endTime: entry.endTime,
    text: entry.text,
    wordsJson: null,
    isUserEdited: false
  }))

  // Clear existing segments for this media
  db.clearSegments(mediaId)
  db.insertSegments(segments)
  db.updateMedia(mediaId, { transcriptionStatus: 'completed' })

  return segments
}

// Create segments at regular intervals (fallback when no SRT available)
export function createAutoSegments(
  mediaId: string,
  durationSeconds: number,
  intervalSeconds: number = 10
): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  let idx = 0
  for (let t = 0; t < durationSeconds; t += intervalSeconds) {
    const endTime = Math.min(t + intervalSeconds, durationSeconds)
    segments.push({
      id: uuidv4(),
      mediaId,
      segmentIndex: idx,
      startTime: t,
      endTime,
      text: `[Segment ${idx + 1}]`,
      wordsJson: null,
      isUserEdited: false
    })
    idx++
  }

  db.clearSegments(mediaId)
  db.insertSegments(segments)

  return segments
}
