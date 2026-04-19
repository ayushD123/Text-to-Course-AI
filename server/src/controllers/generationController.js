const mongoose = require('mongoose')

const Course = require('../models/Course')
const Module = require('../models/Module')
const Lesson = require('../models/Lesson')
const {
  generateCourseOutlineWithProvider,
  generateLessonContentWithProvider,
  generateHinglishExplanationWithProvider,
} = require('../services/aiProviderService')
const { searchYoutubeVideos } = require('../services/youtubeService')
const { generateHinglishAudio } = require('../services/ttsService')
const { getAuthUserId } = require('../middlewares/auth0')
const AppError = require('../utils/appError')

const formatLesson = (lessonDoc, { courseTitle, moduleTitle } = {}) => ({
  id: String(lessonDoc._id),
  courseId: String(lessonDoc.courseId),
  moduleId: String(lessonDoc.moduleId),
  title: lessonDoc.title,
  order: lessonDoc.order,
  status: lessonDoc.status,
  generationStatus: lessonDoc.generationStatus,
  objectives: lessonDoc.objectives,
  content: lessonDoc.content,
  readings: lessonDoc.readings,
  videoQuery: lessonDoc.videoQuery,
  mcqs: lessonDoc.mcqs,
  hinglishExplanation: lessonDoc.hinglishExplanation || '',
  courseTitle,
  moduleTitle,
  createdAt: lessonDoc.createdAt,
  updatedAt: lessonDoc.updatedAt,
})

const buildEnglishExplanationFromContent = (content) => {
  if (!Array.isArray(content)) return ''

  const paragraphText = content
    .filter((block) => block?.type === 'paragraph' && typeof block?.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)

  if (paragraphText.length > 0) {
    return paragraphText.join(' ')
  }

  const headingText = content
    .filter((block) => block?.type === 'heading' && typeof block?.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)

  return headingText.join(' ')
}

const formatCourse = (courseDoc) => ({
  id: String(courseDoc._id),
  topic: courseDoc.topic,
  title: courseDoc.title,
  description: courseDoc.description,
  tags: courseDoc.tags,
  ownerId: courseDoc.ownerId || null,
  isPrivate: Boolean(courseDoc.isPrivate),
  createdAt: courseDoc.createdAt,
  updatedAt: courseDoc.updatedAt,
})

const generateCourseOutline = async (req, res, next) => {
  try {
    const { topic } = req.body || {}
    const authUserId = getAuthUserId(req)

    if (typeof topic !== 'string' || !topic.trim()) {
      throw new AppError(400, 'Invalid request body', ['topic is required and must be a non-empty string'])
    }

    const outline = await generateCourseOutlineWithProvider({ topic: topic.trim() })

    const courseDoc = await Course.create({
      topic: topic.trim(),
      title: outline.title,
      description: outline.description,
      tags: outline.tags,
      ownerId: authUserId || null,
      isPrivate: Boolean(authUserId),
    })

    const modules = []

    for (let moduleIndex = 0; moduleIndex < outline.modules.length; moduleIndex += 1) {
      const outlineModule = outline.modules[moduleIndex]

      const moduleDoc = await Module.create({
        courseId: courseDoc._id,
        title: outlineModule.title,
        order: moduleIndex + 1,
      })

      const lessonDocs = await Lesson.insertMany(
        outlineModule.lessons.map((lesson, lessonIndex) => ({
          courseId: courseDoc._id,
          moduleId: moduleDoc._id,
          title: lesson.title,
          order: lessonIndex + 1,
          status: 'stub',
        })),
      )

      modules.push({
        id: String(moduleDoc._id),
        title: moduleDoc.title,
        order: moduleDoc.order,
        lessons: lessonDocs.map((lessonDoc) => ({
          id: String(lessonDoc._id),
          title: lessonDoc.title,
          order: lessonDoc.order,
          status: lessonDoc.status,
        })),
      })
    }

    return res.status(201).json({
      ok: true,
      data: {
        ...formatCourse(courseDoc),
        modules,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const parseLessonIdFromRequest = (req) => {
  const lessonIdFromBody = req.body?.lessonId
  const lessonIdFromParams = req.params?.id
  const lessonId = lessonIdFromBody || lessonIdFromParams

  if (typeof lessonId !== 'string' || !lessonId.trim()) {
    throw new AppError(400, 'Invalid request body', ['lessonId is required and must be a non-empty string'])
  }

  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError(400, 'Invalid request body', ['lessonId must be a valid MongoDB ObjectId'])
  }

  return lessonId.trim()
}

const generateLessonContentInternal = async ({ lessonId, forceRegenerate = false, authUserId = '' }) => {
  const lessonDoc = await Lesson.findById(lessonId)

  if (!lessonDoc) {
    throw new AppError(404, 'Lesson not found')
  }

  const [courseDoc, moduleDoc] = await Promise.all([Course.findById(lessonDoc.courseId), Module.findById(lessonDoc.moduleId)])

  if (!courseDoc || !moduleDoc) {
    throw new AppError(404, 'Associated course/module not found for lesson')
  }

  const isPrivateCourse = Boolean(courseDoc.isPrivate)
  const isOwner = Boolean(authUserId && courseDoc.ownerId === authUserId)

  if (isPrivateCourse && !isOwner) {
    throw new AppError(404, 'Lesson not found')
  }

  if (!forceRegenerate && lessonDoc.status === 'generated' && Array.isArray(lessonDoc.content) && lessonDoc.content.length > 0) {
    return {
      lessonDoc,
      courseDoc,
      moduleDoc,
    }
  }

  await Lesson.findByIdAndUpdate(lessonId, {
    $set: {
      generationStatus: 'in_progress',
    },
  })

  try {
    const lessonPayload = await generateLessonContentWithProvider({
      context: {
        courseTitle: courseDoc.title,
        moduleTitle: moduleDoc.title,
        lessonTitle: lessonDoc.title,
      },
    })

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        $set: {
          title: lessonPayload.title,
          objectives: lessonPayload.objectives,
          content: lessonPayload.content,
          readings: lessonPayload.readings,
          videoQuery: lessonPayload.videoQuery,
          mcqs: lessonPayload.mcqs,
          status: 'generated',
          generationStatus: 'succeeded',
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!updatedLesson) {
      throw new AppError(404, 'Lesson not found during update')
    }

    return {
      lessonDoc: updatedLesson,
      courseDoc,
      moduleDoc,
    }
  } catch (error) {
    await Lesson.findByIdAndUpdate(lessonId, {
      $set: {
        generationStatus: 'failed',
      },
    })

    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(502, 'Failed to generate lesson content. Please try again.')
  }
}

const generateLessonContent = async (req, res, next) => {
  try {
    const lessonId = parseLessonIdFromRequest(req)
    const authUserId = getAuthUserId(req)
    const result = await generateLessonContentInternal({ lessonId, forceRegenerate: false, authUserId })

    return res.status(200).json({
      ok: true,
      data: formatLesson(result.lessonDoc, {
        courseTitle: result.courseDoc.title,
        moduleTitle: result.moduleDoc.title,
      }),
    })
  } catch (error) {
    return next(error)
  }
}

const regenerateLessonContent = async (req, res, next) => {
  try {
    const lessonId = parseLessonIdFromRequest(req)
    const authUserId = getAuthUserId(req)
    const result = await generateLessonContentInternal({ lessonId, forceRegenerate: true, authUserId })

    return res.status(200).json({
      ok: true,
      data: formatLesson(result.lessonDoc, {
        courseTitle: result.courseDoc.title,
        moduleTitle: result.moduleDoc.title,
      }),
    })
  } catch (error) {
    return next(error)
  }
}

const generateLessonHinglishExplanation = async (req, res, next) => {
  try {
    const lessonId = parseLessonIdFromRequest(req)
    const forceRegenerate = req.body?.forceRegenerate === true
    const authUserId = getAuthUserId(req)

    const lessonDoc = await Lesson.findById(lessonId)

    if (!lessonDoc) {
      throw new AppError(404, 'Lesson not found')
    }

    const [courseDoc, moduleDoc] = await Promise.all([Course.findById(lessonDoc.courseId), Module.findById(lessonDoc.moduleId)])

    if (!courseDoc || !moduleDoc) {
      throw new AppError(404, 'Associated course/module not found for lesson')
    }

    const isPrivateCourse = Boolean(courseDoc.isPrivate)
    const isOwner = Boolean(authUserId && courseDoc.ownerId === authUserId)

    if (isPrivateCourse && !isOwner) {
      throw new AppError(404, 'Lesson not found')
    }

    if (!forceRegenerate && lessonDoc.hinglishExplanation && lessonDoc.hinglishExplanation.trim()) {
      return res.status(200).json({
        ok: true,
        data: formatLesson(lessonDoc, {
          courseTitle: courseDoc.title,
          moduleTitle: moduleDoc.title,
        }),
      })
    }

    if (lessonDoc.status !== 'generated' || !Array.isArray(lessonDoc.content) || lessonDoc.content.length === 0) {
      throw new AppError(409, 'Lesson content is not generated yet')
    }

    const englishExplanation = buildEnglishExplanationFromContent(lessonDoc.content)

    if (!englishExplanation) {
      throw new AppError(409, 'Lesson does not have enough English explanation content')
    }

    const hinglishExplanation = await generateHinglishExplanationWithProvider({
      context: {
        courseTitle: courseDoc.title,
        moduleTitle: moduleDoc.title,
        lessonTitle: lessonDoc.title,
        englishExplanation,
      },
    })

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        $set: {
          hinglishExplanation,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!updatedLesson) {
      throw new AppError(404, 'Lesson not found during update')
    }

    return res.status(200).json({
      ok: true,
      data: formatLesson(updatedLesson, {
        courseTitle: courseDoc.title,
        moduleTitle: moduleDoc.title,
      }),
    })
  } catch (error) {
    if (error instanceof AppError) {
      return next(error)
    }

    return next(new AppError(502, 'Failed to generate Hinglish explanation. Please try again.'))
  }
}

const getLessonHinglishAudio = async (req, res, next) => {
  try {
    const lessonId = parseLessonIdFromRequest(req)
    const authUserId = getAuthUserId(req)

    const lessonDoc = await Lesson.findById(lessonId)

    if (!lessonDoc) {
      throw new AppError(404, 'Lesson not found')
    }

    const [courseDoc, moduleDoc] = await Promise.all([Course.findById(lessonDoc.courseId), Module.findById(lessonDoc.moduleId)])

    if (!courseDoc || !moduleDoc) {
      throw new AppError(404, 'Associated course/module not found for lesson')
    }

    const isPrivateCourse = Boolean(courseDoc.isPrivate)
    const isOwner = Boolean(authUserId && courseDoc.ownerId === authUserId)

    if (isPrivateCourse && !isOwner) {
      throw new AppError(404, 'Lesson not found')
    }

    if (!lessonDoc.hinglishExplanation || !lessonDoc.hinglishExplanation.trim()) {
      throw new AppError(409, 'Hinglish explanation is not generated yet')
    }

    const audioResult = await generateHinglishAudio({
      lessonId,
      text: lessonDoc.hinglishExplanation,
    })

    res.setHeader('Content-Type', audioResult.contentType)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Disposition', `inline; filename="lesson-${lessonId}-hinglish.mp3"`)

    return res.status(200).send(audioResult.audioBuffer)
  } catch (error) {
    return next(error)
  }
}

const getCourses = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId(req)
    const visibilityFilter = authUserId
      ? {
          $or: [{ isPrivate: false }, { ownerId: authUserId }],
        }
      : { isPrivate: false }

    const courses = await Course.find(visibilityFilter).sort({ createdAt: -1 }).lean()

    return res.status(200).json({
      ok: true,
      data: courses.map((course) => formatCourse(course)),
    })
  } catch (error) {
    return next(error)
  }
}

const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid course id')
    }

    const course = await Course.findById(id).lean()

    if (!course) {
      throw new AppError(404, 'Course not found')
    }

    const authUserId = getAuthUserId(req)
    const isPrivateCourse = Boolean(course.isPrivate)
    const isOwner = Boolean(authUserId && course.ownerId === authUserId)

    if (isPrivateCourse && !isOwner) {
      throw new AppError(404, 'Course not found')
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean()

    const moduleIds = modules.map((moduleItem) => moduleItem._id)
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean()

    const lessonsByModuleId = lessons.reduce((acc, lesson) => {
      const key = String(lesson.moduleId)
      if (!acc[key]) acc[key] = []
      acc[key].push({
        id: String(lesson._id),
        title: lesson.title,
        order: lesson.order,
        status: lesson.status,
      })
      return acc
    }, {})

    return res.status(200).json({
      ok: true,
      data: {
        ...formatCourse(course),
        modules: modules.map((moduleItem) => ({
          id: String(moduleItem._id),
          title: moduleItem.title,
          order: moduleItem.order,
          lessons: lessonsByModuleId[String(moduleItem._id)] || [],
        })),
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid lesson id')
    }

    const lessonDoc = await Lesson.findById(id)

    if (!lessonDoc) {
      throw new AppError(404, 'Lesson not found')
    }

    const [courseDoc, moduleDoc] = await Promise.all([
      Course.findById(lessonDoc.courseId),
      Module.findById(lessonDoc.moduleId),
    ])

    const authUserId = getAuthUserId(req)
    const isPrivateCourse = Boolean(courseDoc?.isPrivate)
    const isOwner = Boolean(authUserId && courseDoc?.ownerId === authUserId)

    if (isPrivateCourse && !isOwner) {
      throw new AppError(404, 'Lesson not found')
    }

    return res.status(200).json({
      ok: true,
      data: formatLesson(lessonDoc, {
        courseTitle: courseDoc?.title,
        moduleTitle: moduleDoc?.title,
      }),
    })
  } catch (error) {
    return next(error)
  }
}

const deleteCourseById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid course id')
    }

    const course = await Course.findById(id)

    if (!course) {
      throw new AppError(404, 'Course not found')
    }

    const authUserId = getAuthUserId(req)
    if (course.ownerId && course.ownerId !== authUserId) {
      throw new AppError(403, 'Not allowed to delete this course')
    }

    const modules = await Module.find({ courseId: id }).lean()
    const moduleIds = modules.map((moduleItem) => moduleItem._id)

    await Promise.all([
      Lesson.deleteMany({ courseId: id }),
      Module.deleteMany({ courseId: id }),
      Course.deleteOne({ _id: id }),
    ])

    return res.status(200).json({
      ok: true,
      data: {
        deletedCourseId: id,
        deletedModuleCount: moduleIds.length,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const claimCourseForUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const authUserId = getAuthUserId(req)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid course id')
    }

    if (!authUserId) {
      throw new AppError(401, 'Authentication required')
    }

    const course = await Course.findById(id)

    if (!course) {
      throw new AppError(404, 'Course not found')
    }

    if (course.ownerId && course.ownerId !== authUserId) {
      throw new AppError(409, 'Course already claimed by another user')
    }

    if (!course.ownerId) {
      course.ownerId = authUserId
      course.isPrivate = true
      await course.save()
    }

    return res.status(200).json({
      ok: true,
      data: formatCourse(course),
    })
  } catch (error) {
    return next(error)
  }
}

const getMyCourses = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId(req)

    if (!authUserId) {
      throw new AppError(401, 'Authentication required')
    }

    const courses = await Course.find({ ownerId: authUserId }).sort({ createdAt: -1 }).lean()

    return res.status(200).json({
      ok: true,
      data: courses.map((course) => formatCourse(course)),
    })
  } catch (error) {
    return next(error)
  }
}

const searchVideos = async (req, res, next) => {
  try {
    const query = req.query?.query
    const results = await searchYoutubeVideos({ query })

    return res.status(200).json({
      ok: true,
      data: {
        query: String(query || '').trim(),
        results,
      },
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  generateCourseOutline,
  generateLessonContent,
  regenerateLessonContent,
  generateLessonHinglishExplanation,
  getLessonHinglishAudio,
  getCourses,
  getCourseById,
  getLessonById,
  deleteCourseById,
  claimCourseForUser,
  getMyCourses,
  searchVideos,
}
