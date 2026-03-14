import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'

// We'll use a simple JSON file-based store initially
// and migrate to better-sqlite3 later when needed
const DB_DIR = join(app.getPath('userData'), 'data')
const MEDIA_DIR = join(app.getPath('userData'), 'media')

interface MediaRecord {
  id: string
  title: string
  filePath: string
  audioPath: string | null
  mediaType: 'video' | 'audio'
  durationSeconds: number | null
  fileSizeBytes: number
  importedAt: string
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  thumbnailPath: string | null
}

interface TranscriptSegment {
  id: string
  mediaId: string
  segmentIndex: number
  startTime: number
  endTime: number
  text: string
  wordsJson: string | null
  isUserEdited: boolean
}

interface PracticeResult {
  id: string
  sessionId: string
  segmentId: string | null
  userInput: string | null
  userAudioPath: string | null
  accuracyScore: number | null
  pronunciationScore: number | null
  aiFeedback: string | null
  attemptedAt: string
}

interface PracticeSession {
  id: string
  mediaId: string
  mode: string
  startedAt: string
  completedAt: string | null
  totalSegments: number
  completedSegments: number
}

interface AppSettings {
  [key: string]: string
}

// Simple JSON file-based database
class JsonDatabase {
  private dbPath: string
  private data: {
    media: MediaRecord[]
    segments: TranscriptSegment[]
    sessions: PracticeSession[]
    results: PracticeResult[]
    settings: AppSettings
  }

  constructor() {
    this.dbPath = join(DB_DIR, 'db.json')
    this.data = { media: [], segments: [], sessions: [], results: [], settings: {} }
  }

  init(): void {
    if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true })
    if (!existsSync(MEDIA_DIR)) mkdirSync(MEDIA_DIR, { recursive: true })

    if (existsSync(this.dbPath)) {
      try {
        const raw = readFileSync(this.dbPath, 'utf-8')
        this.data = JSON.parse(raw)
      } catch {
        // corrupted, start fresh
      }
    }
    this.save()
  }

  private save(): void {
    const { writeFileSync } = require('fs')
    writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  // Media operations
  insertMedia(record: MediaRecord): void {
    this.data.media.push(record)
    this.save()
  }

  getMediaList(): MediaRecord[] {
    return this.data.media.sort(
      (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    )
  }

  getMediaById(id: string): MediaRecord | null {
    return this.data.media.find((m) => m.id === id) ?? null
  }

  updateMedia(id: string, updates: Partial<MediaRecord>): void {
    const idx = this.data.media.findIndex((m) => m.id === id)
    if (idx >= 0) {
      this.data.media[idx] = { ...this.data.media[idx], ...updates }
      this.save()
    }
  }

  deleteMedia(id: string): void {
    this.data.media = this.data.media.filter((m) => m.id !== id)
    this.data.segments = this.data.segments.filter((s) => s.mediaId !== id)
    this.save()
  }

  // Segment operations
  clearSegments(mediaId: string): void {
    this.data.segments = this.data.segments.filter((s) => s.mediaId !== mediaId)
    this.save()
  }

  insertSegments(segments: TranscriptSegment[]): void {
    this.data.segments.push(...segments)
    this.save()
  }

  getSegments(mediaId: string): TranscriptSegment[] {
    return this.data.segments
      .filter((s) => s.mediaId === mediaId)
      .sort((a, b) => a.segmentIndex - b.segmentIndex)
  }

  updateSegment(segmentId: string, text: string): void {
    const seg = this.data.segments.find((s) => s.id === segmentId)
    if (seg) {
      seg.text = text
      seg.isUserEdited = true
      this.save()
    }
  }

  // Session operations
  insertSession(session: PracticeSession): void {
    this.data.sessions.push(session)
    this.save()
  }

  updateSession(id: string, updates: Partial<PracticeSession>): void {
    const idx = this.data.sessions.findIndex((s) => s.id === id)
    if (idx >= 0) {
      this.data.sessions[idx] = { ...this.data.sessions[idx], ...updates }
      this.save()
    }
  }

  // Result operations
  insertResult(result: PracticeResult): void {
    this.data.results.push(result)
    this.save()
  }

  getResults(sessionId: string): PracticeResult[] {
    return this.data.results.filter((r) => r.sessionId === sessionId)
  }

  getResultsByMedia(mediaId: string): PracticeResult[] {
    const sessionIds = new Set(
      this.data.sessions.filter((s) => s.mediaId === mediaId).map((s) => s.id)
    )
    return this.data.results.filter((r) => sessionIds.has(r.sessionId))
  }

  // Settings
  getSetting(key: string): string | null {
    return this.data.settings[key] ?? null
  }

  setSetting(key: string, value: string): void {
    this.data.settings[key] = value
    this.save()
  }

  getSettings(): AppSettings {
    return { ...this.data.settings }
  }

  getMediaDir(): string {
    return MEDIA_DIR
  }
}

export const db = new JsonDatabase()

export function initDatabase(): void {
  db.init()
}

export type { MediaRecord, TranscriptSegment, PracticeResult, PracticeSession, AppSettings }
