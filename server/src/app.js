const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const healthRouter = require('./routes/healthRoutes')
const generationRouter = require('./routes/generationRoutes')
const notFound = require('./middlewares/notFound')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.use('/api', healthRouter)
app.use('/api', generationRouter)

app.use(notFound)
app.use(errorHandler)

module.exports = app
