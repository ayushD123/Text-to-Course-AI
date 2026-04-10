const env = require('../config/env')
const AppError = require('../utils/appError')

const videoCache = new Map()

const EDUCATIONAL_KEYWORDS = ['tutorial', 'learn', 'course', 'explained', 'lesson', 'beginner', 'guide']

const normalizeQuery = (query) => String(query || '').trim().toLowerCase()

const getCachedResult = (cacheKey) => {
  const cached = videoCache.get(cacheKey)
  if (!cached) return null

  if (cached.expiresAt <= Date.now()) {
    videoCache.delete(cacheKey)
    return null
  }

  return cached.results
}

const setCachedResult = (cacheKey, results) => {
  videoCache.set(cacheKey, {
    expiresAt: Date.now() + env.YOUTUBE_CACHE_TTL_MS,
    results,
  })
}

const buildEducationalScore = ({ title, description }) => {
  const text = `${title} ${description}`.toLowerCase()

  return EDUCATIONAL_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score
  }, 0)
}

const searchYoutubeVideos = async ({ query }) => {
  const cleanedQuery = String(query || '').trim()

  if (!cleanedQuery) {
    throw new AppError(400, 'query is required and must be a non-empty string')
  }

  if (!env.YOUTUBE_API_KEY) {
    throw new AppError(500, 'YOUTUBE_API_KEY is missing on the server')
  }

  const cacheKey = normalizeQuery(cleanedQuery)
  const cachedResults = getCachedResult(cacheKey)
  if (cachedResults) {
    return cachedResults
  }

  const requestUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  requestUrl.searchParams.set('part', 'snippet')
  requestUrl.searchParams.set('type', 'video')
  requestUrl.searchParams.set('videoEmbeddable', 'true')
  requestUrl.searchParams.set('maxResults', '8')
  requestUrl.searchParams.set('safeSearch', 'moderate')
  requestUrl.searchParams.set('q', `${cleanedQuery} tutorial`)
  requestUrl.searchParams.set('key', env.YOUTUBE_API_KEY)

  let response
  try {
    response = await fetch(requestUrl.toString())
  } catch (error) {
    throw new AppError(502, 'Failed to reach YouTube API')
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new AppError(502, payload?.error?.message || 'YouTube API request failed')
  }

  const rawItems = Array.isArray(payload?.items) ? payload.items : []

  const rankedResults = rawItems
    .map((item) => {
      const videoId = item?.id?.videoId
      const title = String(item?.snippet?.title || '').trim()

      if (!videoId || !title) return null

      const description = String(item?.snippet?.description || '').trim()

      return {
        videoId,
        title,
        description,
        channelTitle: String(item?.snippet?.channelTitle || '').trim(),
        thumbnailUrl:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          '',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        educationalScore: buildEducationalScore({ title, description }),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.educationalScore - a.educationalScore)

  const topResults = rankedResults.slice(0, 3).map(({ educationalScore, ...video }) => video)

  setCachedResult(cacheKey, topResults)

  return topResults
}

module.exports = {
  searchYoutubeVideos,
}
