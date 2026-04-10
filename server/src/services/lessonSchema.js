const AppError = require('../utils/appError')

const ALLOWED_BLOCK_TYPES = new Set(['heading', 'paragraph', 'code', 'video', 'mcq'])

const toCleanString = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback
  return value.trim()
}

const toStringArray = (value, { max = 10 } = {}) => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => toCleanString(item))
    .filter(Boolean)
    .slice(0, max)
}

const normalizeAnswer = ({ answer, options }) => {
  const normalizedAnswer = toCleanString(answer).toUpperCase()
  const labels = ['A', 'B', 'C', 'D']

  if (labels.includes(normalizedAnswer)) {
    return normalizedAnswer
  }

  const matchingIndex = options.findIndex((option) => option.toLowerCase() === toCleanString(answer).toLowerCase())
  if (matchingIndex >= 0) {
    return labels[matchingIndex]
  }

  return ''
}

const normalizeMcqs = (mcqs) => {
  if (!Array.isArray(mcqs) || mcqs.length < 4) {
    throw new AppError(502, 'AI provider returned invalid lesson quiz (minimum 4 MCQs required)')
  }

  const normalized = mcqs.slice(0, 5).map((mcq, index) => {
    const question = toCleanString(mcq?.question)
    const options = toStringArray(mcq?.options, { max: 4 })
    const explanation = toCleanString(mcq?.explanation)
    const answer = normalizeAnswer({ answer: mcq?.answer, options })

    if (!question) {
      throw new AppError(502, `AI provider returned MCQ ${index + 1} without question`)
    }

    if (options.length !== 4) {
      throw new AppError(502, `AI provider returned MCQ ${index + 1} without exactly 4 options`)
    }

    if (!answer) {
      throw new AppError(502, `AI provider returned MCQ ${index + 1} with invalid answer`)
    }

    if (!explanation) {
      throw new AppError(502, `AI provider returned MCQ ${index + 1} without explanation`)
    }

    return {
      question,
      options,
      answer,
      explanation,
    }
  })

  if (normalized.length < 4) {
    throw new AppError(502, 'AI provider returned invalid lesson quiz (minimum 4 MCQs required)')
  }

  return normalized
}

const normalizeContent = ({ content, videoQuery }) => {
  if (!Array.isArray(content) || content.length === 0) {
    throw new AppError(502, 'AI provider returned lesson without content blocks')
  }

  const normalized = content
    .map((block) => {
      const type = toCleanString(block?.type).toLowerCase()
      if (!ALLOWED_BLOCK_TYPES.has(type)) return null

      if (type === 'heading') {
        const text = toCleanString(block?.text)
        if (!text) return null
        return { type: 'heading', text }
      }

      if (type === 'paragraph') {
        const text = toCleanString(block?.text)
        if (!text) return null
        return { type: 'paragraph', text }
      }

      if (type === 'code') {
        const code = toCleanString(block?.code)
        if (!code) return null
        return {
          type: 'code',
          language: toCleanString(block?.language, 'javascript'),
          code,
        }
      }

      if (type === 'video') {
        const title = toCleanString(block?.title, 'Suggested video walkthrough')
        return {
          type: 'video',
          provider: 'youtube',
          title,
          videoQuery,
        }
      }

      const text = toCleanString(block?.text, 'Practice with the quiz section below to test your understanding.')
      return {
        type: 'mcq',
        text,
      }
    })
    .filter(Boolean)

  if (normalized.length === 0) {
    throw new AppError(502, 'AI provider returned unsupported lesson content')
  }

  const hasVideo = normalized.some((block) => block.type === 'video')
  if (!hasVideo) {
    normalized.push({
      type: 'video',
      provider: 'youtube',
      title: 'Suggested video walkthrough',
      videoQuery,
    })
  }

  const hasMcqHint = normalized.some((block) => block.type === 'mcq')
  if (!hasMcqHint) {
    normalized.push({
      type: 'mcq',
      text: 'Practice with the quiz section below to test your understanding.',
    })
  }

  return normalized
}

const normalizeLesson = ({ lessonPayload, context }) => {
  if (!lessonPayload || typeof lessonPayload !== 'object' || Array.isArray(lessonPayload)) {
    throw new AppError(502, 'AI provider returned invalid lesson payload')
  }

  const title = toCleanString(lessonPayload.title, context.lessonTitle)
  const objectives = toStringArray(lessonPayload.objectives, { max: 8 })
  const readings = toStringArray(lessonPayload.readings, { max: 10 })
  const videoQuery = toCleanString(
    lessonPayload.videoQuery,
    `${context.lessonTitle} ${context.moduleTitle} ${context.courseTitle} tutorial`,
  )
  const mcqs = normalizeMcqs(lessonPayload.mcqs)
  const content = normalizeContent({ content: lessonPayload.content, videoQuery })

  if (objectives.length === 0) {
    throw new AppError(502, 'AI provider returned lesson without objectives')
  }

  return {
    title,
    objectives,
    content,
    readings,
    videoQuery,
    mcqs,
  }
}

module.exports = {
  normalizeLesson,
}
