const express = require('express')

const {
  generateCourseOutline,
  generateLessonContent,
  regenerateLessonContent,
  getCourses,
  getCourseById,
  getLessonById,
  deleteCourseById,
  searchVideos,
} = require('../controllers/generationController')

const generationRouter = express.Router()

generationRouter.get('/courses', getCourses)
generationRouter.get('/courses/:id', getCourseById)
generationRouter.delete('/courses/:id', deleteCourseById)
generationRouter.post('/courses/generate-outline', generateCourseOutline)
generationRouter.get('/videos/search', searchVideos)

generationRouter.get('/lessons/:id', getLessonById)
generationRouter.post('/lessons/generate', generateLessonContent)
generationRouter.post('/lessons/:id/regenerate', regenerateLessonContent)

module.exports = generationRouter
