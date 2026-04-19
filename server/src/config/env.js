const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || '',
  GENERATION_PROVIDER: ['mock', 'groq'].includes((process.env.GENERATION_PROVIDER || 'mock').toLowerCase())
    ? (process.env.GENERATION_PROVIDER || 'mock').toLowerCase()
    : 'mock',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  YOUTUBE_CACHE_TTL_MS: Number(process.env.YOUTUBE_CACHE_TTL_MS) || 10 * 60 * 1000,
  TTS_PROVIDER: ['none', 'streamelements'].includes((process.env.TTS_PROVIDER || 'none').toLowerCase())
    ? (process.env.TTS_PROVIDER || 'none').toLowerCase()
    : 'none',
  TTS_VOICE: process.env.TTS_VOICE || 'Brian',
  TTS_CACHE_TTL_MS: Number(process.env.TTS_CACHE_TTL_MS) || 5 * 60 * 1000,
  AUTH0_ISSUER: process.env.AUTH0_ISSUER || '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || '',
}

module.exports = env
