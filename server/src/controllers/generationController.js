const mongoose = require('mongoose')

const Course = require('../models/Course')
const Module = require('../models/Module')
const Lesson = require('../models/Lesson')
const { generateCourseOutlineWithProvider, generateLessonContentWithProvider } = require('../services/aiProviderService')
const { searchYoutubeVideos } = require('../services/youtubeService')
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
  courseTitle,
  moduleTitle,
  createdAt: lessonDoc.createdAt,
  updatedAt: lessonDoc.updatedAt,
})

const generateCourseOutline = async (req, res, next) => {
  try {
    const { topic } = req.body || {}

    if (typeof topic !== 'string' || !topic.trim()) {
      throw new AppError(400, 'Invalid request body', ['topic is required and must be a non-empty string'])
    }

    const outline = await generateCourseOutlineWithProvider({ topic: topic.trim() })

    const courseDoc = await Course.create({
      topic: topic.trim(),
      title: outline.title,
      description: outline.description,
      tags: outline.tags,
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
        id: String(courseDoc._id),
        topic: courseDoc.topic,
        title: courseDoc.title,
        description: courseDoc.description,
        tags: courseDoc.tags,
        modules,
        createdAt: courseDoc.createdAt,
        updatedAt: courseDoc.updatedAt,
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

const generateLessonContentInternal = async ({ lessonId, forceRegenerate = false }) => {
  const lessonDoc = await Lesson.findById(lessonId)

  if (!lessonDoc) {
    throw new AppError(404, 'Lesson not found')
  }

  const [courseDoc, moduleDoc] = await Promise.all([Course.findById(lessonDoc.courseId), Module.findById(lessonDoc.moduleId)])

  if (!courseDoc || !moduleDoc) {
    throw new AppError(404, 'Associated course/module not found for lesson')
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
    const result = await generateLessonContentInternal({ lessonId, forceRegenerate: false })

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
    const result = await generateLessonContentInternal({ lessonId, forceRegenerate: true })

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

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean()

    return res.status(200).json({
      ok: true,
      data: courses.map((course) => ({
        id: String(course._id),
        topic: course.topic,
        title: course.title,
        description: course.description,
        tags: course.tags,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })),
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
        id: String(course._id),
        topic: course.topic,
        title: course.title,
        description: course.description,
        tags: course.tags,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
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
  getCourses,
  getCourseById,
  getLessonById,
  deleteCourseById,
  searchVideos,
}
