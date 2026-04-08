const express = require('express')

const {
  generateCourseOutline,
  generateLessonContent,
} = require('../controllers/generationController')

const generationRouter = express.Router()

generationRouter.post('/courses/generate-outline', generateCourseOutline)
generationRouter.post('/lessons/generate', generateLessonContent)

module.exports = generationRouter
