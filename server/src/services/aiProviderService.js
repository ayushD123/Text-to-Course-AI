const env = require('../config/env')
const AppError = require('../utils/appError')
const { generateOutline, generateLesson, generateHinglishExplanation } = require('./mockGeneratorService')
const { generateWithGroq, generateLessonWithGroq, generateHinglishExplanationWithGroq } = require('./groqOutlineProvider')
const { normalizeOutline } = require('./outlineSchema')
const { normalizeLesson } = require('./lessonSchema')

const generateCourseOutlineWithProvider = async ({ topic }) => {
  const provider = env.GENERATION_PROVIDER

  if (provider === 'groq') {
    const rawOutline = await generateWithGroq({
      topic,
      apiKey: env.GROQ_API_KEY,
      model: env.GROQ_MODEL,
    })

    return normalizeOutline({ topic, outline: rawOutline })
  }

  const mockOutline = generateOutline(topic)
  return normalizeOutline({ topic, outline: mockOutline })
}

const generateLessonContentWithProvider = async ({ context }) => {
  const provider = env.GENERATION_PROVIDER

  if (provider === 'groq') {
    const rawLesson = await generateLessonWithGroq({
      context,
      apiKey: env.GROQ_API_KEY,
      model: env.GROQ_MODEL,
    })

    return normalizeLesson({
      lessonPayload: rawLesson,
      context,
    })
  }

  const mockLesson = generateLesson({
    courseTitle: context.courseTitle,
    moduleTitle: context.moduleTitle,
    lessonTitle: context.lessonTitle,
  })

  return normalizeLesson({
    lessonPayload: {
      ...mockLesson,
      videoQuery: `${context.lessonTitle} ${context.moduleTitle} ${context.courseTitle} tutorial`,
    },
    context,
  })
}

const generateHinglishExplanationWithProvider = async ({ context }) => {
  const provider = env.GENERATION_PROVIDER

  if (provider === 'groq') {
    const rawHinglish = await generateHinglishExplanationWithGroq({
      context,
      apiKey: env.GROQ_API_KEY,
      model: env.GROQ_MODEL,
    })

    const hinglishExplanation = String(rawHinglish?.hinglishExplanation || '').trim()

    if (!hinglishExplanation) {
      throw new AppError(502, 'AI provider returned empty Hinglish explanation')
    }

    return hinglishExplanation
  }

  return generateHinglishExplanation({
    courseTitle: context.courseTitle,
    moduleTitle: context.moduleTitle,
    lessonTitle: context.lessonTitle,
    englishExplanation: context.englishExplanation,
  })
}

module.exports = {
  generateCourseOutlineWithProvider,
  generateLessonContentWithProvider,
  generateHinglishExplanationWithProvider,
}
