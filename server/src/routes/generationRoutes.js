const express = require('express')

const {
  generateCourseOutline,
  generateLessonContent,
  regenerateLessonContent,
  generateLessonHinglishExplanation,
  getCourses,
  getCourseById,
  getLessonById,
  deleteCourseById,
  claimCourseForUser,
  getMyCourses,
  searchVideos,
} = require('../controllers/generationController')
const { optionalAuth, requireAuth } = require('../middlewares/auth0')

const generationRouter = express.Router()

generationRouter.use(optionalAuth)

generationRouter.get('/courses', getCourses)
generationRouter.get('/courses/:id', getCourseById)
generationRouter.delete('/courses/:id', deleteCourseById)
generationRouter.post('/courses/:id/claim', requireAuth, claimCourseForUser)
generationRouter.post('/courses/generate-outline', requireAuth, generateCourseOutline)
generationRouter.get('/me/courses', requireAuth, getMyCourses)
generationRouter.get('/videos/search', searchVideos)

generationRouter.get('/lessons/:id', getLessonById)
generationRouter.post('/lessons/generate', generateLessonContent)
generationRouter.post('/lessons/:id/regenerate', regenerateLessonContent)
generationRouter.post('/lessons/:id/hinglish', generateLessonHinglishExplanation)

module.exports = generationRouter
