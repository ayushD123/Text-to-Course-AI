const express = require('express')
const { getHealth } = require('../controllers/healthController')

const healthRouter = express.Router()

healthRouter.get('/health', getHealth)

module.exports = healthRouter
