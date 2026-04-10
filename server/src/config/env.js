const dotenv = require('dotenv')

dotenv.config()

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
}

module.exports = env
