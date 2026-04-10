const env = require('../config/env')
const { generateOutline, generateLesson } = require('./mockGeneratorService')
const { generateWithGroq, generateLessonWithGroq } = require('./groqOutlineProvider')
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

module.exports = {
  generateCourseOutlineWithProvider,
  generateLessonContentWithProvider,
}
