export interface MediaRecord {
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

export interface TranscriptSegment {
  id: string
  mediaId: string
  segmentIndex: number
  startTime: number
  endTime: number
  text: string
  wordsJson: string | null
  isUserEdited: boolean
}

export interface WordTiming {
  word: string
  startTime: number
  endTime: number
  confidence: number
}

export interface PracticeSession {
  id: string
  mediaId: string
  mode: 'echo' | 'dictation' | 'shadow' | 'dialog'
  startedAt: string
  completedAt: string | null
  totalSegments: number
  completedSegments: number
}

export interface PracticeResult {
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
