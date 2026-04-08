const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const healthRouter = require('./routes/healthRoutes')
const notFound = require('./middlewares/notFound')

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.use('/api', healthRouter)

app.use(notFound)

module.exports = app
