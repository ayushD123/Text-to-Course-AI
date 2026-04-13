const { auth } = require('express-oauth2-jwt-bearer')

const env = require('../config/env')
const AppError = require('../utils/appError')

const validateAuth0Env = () => {
  if (!env.AUTH0_ISSUER || !env.AUTH0_AUDIENCE) {
    throw new AppError(500, 'Auth configuration missing', ['AUTH0_ISSUER and AUTH0_AUDIENCE are required on server'])
  }
}

const buildAuthMiddleware = ({ authRequired }) => {
  validateAuth0Env()

  const authMiddleware = auth({
    issuerBaseURL: env.AUTH0_ISSUER,
    audience: env.AUTH0_AUDIENCE,
    tokenSigningAlg: 'RS256',
  })

  if (authRequired) {
    return authMiddleware
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      return next()
    }

    return authMiddleware(req, res, next)
  }
}

const requireAuth = buildAuthMiddleware({ authRequired: true })
const optionalAuth = buildAuthMiddleware({ authRequired: false })

const getAuthUserId = (req) => req.auth?.payload?.sub || ''

module.exports = {
  requireAuth,
  optionalAuth,
  getAuthUserId,
}
