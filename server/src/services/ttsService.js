const env = require('../config/env')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

const AppError = require('../utils/appError')

const execFileAsync = promisify(execFile)
const MAX_TTS_CHARS_PER_REQUEST = 140

const fetchGoogleTtsChunk = async ({ text }) => {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=hi&q=${encodeURIComponent(text)}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'audio/mpeg,*/*',
    },
  })

  if (!response.ok) {
    throw new AppError(503, `Google TTS unavailable (status: ${response.status})`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (!buffer.length) {
    throw new AppError(503, 'Google TTS returned empty audio')
  }

  return {
    audioBuffer: buffer,
    contentType: response.headers.get('content-type') || 'audio/mpeg',
  }
}

const ttsCache = new Map()

const getCacheKey = ({ lessonId, text, voice }) => {
  const hash = String(text || '').split('').reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) % 1000000007, 7)
  return `${lessonId}:${voice}:${hash}`
}

const getCachedAudio = (cacheKey) => {
  const cached = ttsCache.get(cacheKey)
  if (!cached) return null

  if (Date.now() > cached.expiresAt) {
    ttsCache.delete(cacheKey)
    return null
  }

  return cached
}

const setCachedAudio = (cacheKey, payload) => {
  ttsCache.set(cacheKey, {
    ...payload,
    expiresAt: Date.now() + env.TTS_CACHE_TTL_MS,
  })
}

const fetchStreamElementsAudioChunk = async ({ text, voice }) => {
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`

  let fetchFailureStatus = null

  try {
    const response = await fetch(url)

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (!buffer.length) {
        throw new AppError(503, 'TTS provider returned empty audio')
      }

      return {
        audioBuffer: buffer,
        contentType: response.headers.get('content-type') || 'audio/mpeg',
      }
    }

    fetchFailureStatus = response.status
  } catch {
    fetchFailureStatus = fetchFailureStatus || 'network_error'
  }

  try {
    const curlBinary = process.platform === 'win32' ? 'curl.exe' : 'curl'
    const { stdout } = await execFileAsync(
      curlBinary,
      ['-sS', '-L', '--fail', url, '--output', '-'],
      {
        encoding: 'buffer',
        maxBuffer: 20 * 1024 * 1024,
      },
    )

    const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout)
    if (!buffer.length) {
      throw new AppError(503, 'TTS provider returned empty audio')
    }

    return {
      audioBuffer: buffer,
      contentType: 'audio/mpeg',
    }
  } catch {
    try {
      return await fetchGoogleTtsChunk({ text })
    } catch (googleError) {
      throw new AppError(503, `TTS provider is currently unavailable (status: ${fetchFailureStatus || 'unknown'})`)
    }
  }
}

const splitTextIntoChunks = (text, maxChars) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []

  const words = clean.split(' ')
  const chunks = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    if (current) {
      chunks.push(current)
      current = word
    } else {
      chunks.push(word.slice(0, maxChars))
      current = word.slice(maxChars)
    }
  }

  if (current) chunks.push(current)
  return chunks
}

const fetchStreamElementsAudio = async ({ text, voice }) => {
  const chunks = splitTextIntoChunks(text, MAX_TTS_CHARS_PER_REQUEST)

  if (!chunks.length) {
    throw new AppError(409, 'Hinglish explanation text is missing')
  }

  const audioBuffers = []
  for (const chunk of chunks) {
    const part = await fetchStreamElementsAudioChunk({ text: chunk, voice })
    audioBuffers.push(part.audioBuffer)
  }

  return {
    audioBuffer: Buffer.concat(audioBuffers),
    contentType: 'audio/mpeg',
  }
}

const generateHinglishAudio = async ({ lessonId, text }) => {
  const provider = env.TTS_PROVIDER
  const cleanText = String(text || '').trim()

  if (!cleanText) {
    throw new AppError(409, 'Hinglish explanation text is missing')
  }

  if (provider === 'none') {
    throw new AppError(503, 'Text-to-speech is not configured on the server')
  }

  if (provider !== 'streamelements') {
    throw new AppError(503, 'Configured TTS provider is not supported')
  }

  const cacheKey = getCacheKey({ lessonId, text: cleanText, voice: env.TTS_VOICE })
  const cached = getCachedAudio(cacheKey)
  if (cached) {
    return cached
  }

  const generatedAudio = await fetchStreamElementsAudio({
    text: cleanText,
    voice: env.TTS_VOICE,
  })

  setCachedAudio(cacheKey, generatedAudio)
  return generatedAudio
}

module.exports = {
  generateHinglishAudio,
}
