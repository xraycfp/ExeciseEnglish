import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync, unlinkSync } from 'fs'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

// Extensions that Chromium's HTML5 video can play natively
const WEB_NATIVE_VIDEO = ['.mp4', '.webm']

export function needsConversion(ext: string): boolean {
  return !WEB_NATIVE_VIDEO.includes(ext.toLowerCase())
}

/**
 * Convert a video file to MP4 with web-compatible codecs.
 * First tries fast remux (copy video, transcode audio to AAC).
 * If that fails, falls back to full transcode.
 */
export async function convertToMp4(inputPath: string, outputPath: string): Promise<void> {
  if (!ffmpegPath) {
    throw new Error('FFmpeg binary not found')
  }

  try {
    // Fast path: copy video stream, only re-encode audio to AAC
    await execFileAsync(ffmpegPath, [
      '-i', inputPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ], { timeout: 600_000 })
  } catch {
    // Clean up partial output before retry
    if (existsSync(outputPath)) unlinkSync(outputPath)

    // Slow path: full transcode (video codec incompatible with MP4 container)
    await execFileAsync(ffmpegPath, [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ], { timeout: 1_200_000 })
  }
}
