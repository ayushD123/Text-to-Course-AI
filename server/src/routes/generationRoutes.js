const express = require('express')

const {
  generateCourseOutline,
  generateLessonContent,
  getCourses,
  getCourseById,
  getLessonById,
  deleteCourseById,
} = require('../controllers/generationController')

const generationRouter = express.Router()

generationRouter.get('/courses', getCourses)
generationRouter.get('/courses/:id', getCourseById)
generationRouter.delete('/courses/:id', deleteCourseById)
generationRouter.post('/courses/generate-outline', generateCourseOutline)

generationRouter.get('/lessons/:id', getLessonById)
generationRouter.post('/lessons/generate', generateLessonContent)

module.exports = generationRouter
