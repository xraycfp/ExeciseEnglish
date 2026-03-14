import { ElectronAPI } from '@electron-toolkit/preload'

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

interface PracticeSession {
  id: string
  mediaId: string
  mode: string
  startedAt: string
  completedAt: string | null
  totalSegments: number
  completedSegments: number
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

interface Api {
  importMedia(): Promise<MediaRecord | null>
  importMediaFile(filePath: string): Promise<MediaRecord>
  getMediaList(): Promise<MediaRecord[]>
  getMediaById(id: string): Promise<MediaRecord | null>
  deleteMedia(id: string): Promise<void>
  updateMedia(id: string, updates: Partial<MediaRecord>): Promise<void>

  getSegments(mediaId: string): Promise<TranscriptSegment[]>
  updateSegment(segmentId: string, text: string): Promise<void>
  importSrt(mediaId: string): Promise<TranscriptSegment[]>
  autoSegment(mediaId: string, durationSeconds: number, intervalSeconds: number): Promise<TranscriptSegment[]>

  createSession(session: PracticeSession): Promise<PracticeSession>
  updateSession(id: string, updates: Partial<PracticeSession>): Promise<void>
  saveResult(result: PracticeResult): Promise<void>
  getResults(sessionId: string): Promise<PracticeResult[]>
  getResultsByMedia(mediaId: string): Promise<PracticeResult[]>

  getSettings(): Promise<Record<string, string>>
  setSetting(key: string, value: string): Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
