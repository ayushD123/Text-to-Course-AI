const AppError = require('../utils/appError')

const MAX_MODULES = 12
const MAX_LESSONS_PER_MODULE = 12

const toCleanString = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback
  return value.trim()
}

const toStringArray = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => toCleanString(item))
    .filter(Boolean)
}

const normalizeOutline = ({ topic, outline }) => {
  if (!outline || typeof outline !== 'object' || Array.isArray(outline)) {
    throw new AppError(502, 'AI provider returned invalid outline payload')
  }

  const topicLabel = toCleanString(topic)
  const title = toCleanString(outline.title) || `${topicLabel} Course`
  const description =
    toCleanString(outline.description) || `A practical and beginner-friendly course outline for ${topicLabel}.`

  const tags = [...new Set(toStringArray(outline.tags).slice(0, 8))]

  if (!Array.isArray(outline.modules) || outline.modules.length === 0) {
    throw new AppError(502, 'AI provider returned outline without modules')
  }

  const modules = outline.modules.slice(0, MAX_MODULES).map((moduleItem, moduleIndex) => {
    const moduleTitle = toCleanString(moduleItem?.title)

    if (!moduleTitle) {
      throw new AppError(502, `AI provider returned module ${moduleIndex + 1} without title`)
    }

    if (!Array.isArray(moduleItem?.lessons) || moduleItem.lessons.length === 0) {
      throw new AppError(502, `AI provider returned module ${moduleIndex + 1} without lessons`)
    }

    const lessons = moduleItem.lessons.slice(0, MAX_LESSONS_PER_MODULE).map((lessonItem, lessonIndex) => {
      const lessonTitle = toCleanString(lessonItem?.title)
      if (!lessonTitle) {
        throw new AppError(
          502,
          `AI provider returned lesson ${lessonIndex + 1} in module ${moduleIndex + 1} without title`,
        )
      }

      return {
        title: lessonTitle,
      }
    })

    return {
      title: moduleTitle,
      lessons,
    }
  })

  return {
    title,
    description,
    tags,
    modules,
  }
}

module.exports = {
  normalizeOutline,
}
