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

function parseSrtTimestamp(ts: string): number {
  // Format: 00:01:23,456 or 00:01:23.456
  const parts = ts.trim().replace(',', '.').split(':')
  const hours = parseFloat(parts[0])
  const minutes = parseFloat(parts[1])
  const seconds = parseFloat(parts[2])
  return hours * 3600 + minutes * 60 + seconds
}

function parseAssTimestamp(ts: string): number {
  // Format: H:MM:SS.cc (centiseconds, e.g. 0:02:15.40)
  const parts = ts.trim().split(':')
  const hours = parseFloat(parts[0])
  const minutes = parseFloat(parts[1])
  const seconds = parseFloat(parts[2])
  return hours * 3600 + minutes * 60 + seconds
}

function parseAss(content: string): SrtEntry[] {
  const entries: SrtEntry[] = []
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  let inEvents = false
  let formatFields: string[] = []
  let index = 0

  for (const line of lines) {
    const trimmed = line.trim()

    // Track which section we're in
    if (trimmed.startsWith('[')) {
      inEvents = trimmed.toLowerCase() === '[events]'
      continue
    }

    if (!inEvents) continue

    // Parse the Format line to know field positions
    if (trimmed.startsWith('Format:')) {
      formatFields = trimmed
        .substring(7)
        .split(',')
        .map((f) => f.trim().toLowerCase())
      continue
    }

    // Parse Dialogue lines
    if (!trimmed.startsWith('Dialogue:')) continue

    const data = trimmed.substring(9)
    // The Text field (last) can contain commas, so split only up to field count - 1
    const fieldCount = formatFields.length
    const parts = data.split(',')
    if (parts.length < fieldCount) continue

    const startIdx = formatFields.indexOf('start')
    const endIdx = formatFields.indexOf('end')
    const textIdx = formatFields.indexOf('text')
    if (startIdx === -1 || endIdx === -1 || textIdx === -1) continue

    const startTime = parseAssTimestamp(parts[startIdx])
    const endTime = parseAssTimestamp(parts[endIdx])

    // Text is everything from textIdx onward (may contain commas)
    let text = parts.slice(textIdx).join(',').trim()

    // Strip ASS override tags: {\...}
    text = text.replace(/\{[^}]*\}/g, '')
    // Convert \N (hard newline) and \n (soft newline) to spaces
    text = text.replace(/\\[Nn]/g, ' ')
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()

    if (text) {
      entries.push({ index: index++, startTime, endTime, text })
    }
  }

  // ASS dialogue lines can be out of order
  entries.sort((a, b) => a.startTime - b.startTime)
  // Re-index after sorting
  entries.forEach((e, i) => (e.index = i))

  return entries
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

    const startTime = parseSrtTimestamp(timeMatch[1])
    const endTime = parseSrtTimestamp(timeMatch[2])
    const text = lines.slice(2).join(' ').replace(/<[^>]*>/g, '').trim()

    if (text) {
      entries.push({ index, startTime, endTime, text })
    }
  }

  // Deduplicate overlapping entries from streaming ASR.
  // Handles 3 cases: full containment, and partial tail-head word overlap.
  const deduped: SrtEntry[] = []
  for (const entry of entries) {
    const prev = deduped[deduped.length - 1]
    if (prev) {
      // Case 1: current fully contains previous → replace
      if (entry.text.includes(prev.text)) {
        prev.text = entry.text
        prev.endTime = entry.endTime
        continue
      }
      // Case 2: previous fully contains current → absorb
      if (prev.text.includes(entry.text)) {
        prev.endTime = Math.max(prev.endTime, entry.endTime)
        continue
      }
      // Case 3: partial overlap — tail of prev matches head of current
      const prevWords = prev.text.split(/\s+/)
      const currWords = entry.text.split(/\s+/)
      const maxCheck = Math.min(prevWords.length, currWords.length)
      let overlapLen = 0
      for (let len = maxCheck; len >= 2; len--) {
        if (
          prevWords.slice(-len).join(' ').toLowerCase() ===
          currWords.slice(0, len).join(' ').toLowerCase()
        ) {
          overlapLen = len
          break
        }
      }
      if (overlapLen > 0) {
        // Trim the overlapping tail from prev; keep curr intact
        prev.text = prevWords.slice(0, -overlapLen).join(' ')
        prev.endTime = entry.startTime
        // If prev becomes empty after trimming, drop it
        if (!prev.text.trim()) {
          deduped.pop()
        }
      }
    }
    deduped.push({ ...entry })
  }

  return deduped
}

export async function importSrtDialog(mediaId: string): Promise<TranscriptSegment[]> {
  const result = await dialog.showOpenDialog({
    title: '导入字幕文件',
    filters: [
      { name: '字幕文件', extensions: ['srt', 'ass', 'ssa', 'txt'] }
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
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const entries = (ext === 'ass' || ext === 'ssa') ? parseAss(content) : parseSrt(content)

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
