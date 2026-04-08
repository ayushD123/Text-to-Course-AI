const { generateOutline, generateLesson } = require('../services/mockGeneratorService')
const AppError = require('../utils/appError')

const generateCourseOutline = (req, res, next) => {
  try {
    const { topic } = req.body || {}

    if (typeof topic !== 'string' || !topic.trim()) {
      throw new AppError(400, 'Invalid request body', ['topic is required and must be a non-empty string'])
    }

    const outline = generateOutline(topic)

    return res.status(200).json({
      ok: true,
      data: outline,
    })
  } catch (error) {
    return next(error)
  }
}

const generateLessonContent = (req, res, next) => {
  try {
    const { courseTitle, moduleTitle, lessonTitle } = req.body || {}
    const errors = []

    if (typeof courseTitle !== 'string' || !courseTitle.trim()) {
      errors.push('courseTitle is required and must be a non-empty string')
    }

    if (typeof moduleTitle !== 'string' || !moduleTitle.trim()) {
      errors.push('moduleTitle is required and must be a non-empty string')
    }

    if (typeof lessonTitle !== 'string' || !lessonTitle.trim()) {
      errors.push('lessonTitle is required and must be a non-empty string')
    }

    if (errors.length) {
      throw new AppError(400, 'Invalid request body', errors)
    }

    const lesson = generateLesson({
      courseTitle: courseTitle.trim(),
      moduleTitle: moduleTitle.trim(),
      lessonTitle: lessonTitle.trim(),
    })

    return res.status(200).json({
      ok: true,
      data: lesson,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  generateCourseOutline,
  generateLessonContent,
}
