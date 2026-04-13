const AppError = require('../utils/appError')

const errorHandler = (err, req, res, next) => {
  if (err?.status === 401 || err?.name === 'UnauthorizedError') {
    return res.status(401).json({
      ok: false,
      error: {
        message: 'Unauthorized',
        details: [err.message || 'Missing or invalid token'],
      },
    })
  }

  if (err?.status === 403 || err?.code === 'invalid_token') {
    return res.status(403).json({
      ok: false,
      error: {
        message: 'Forbidden',
        details: [err.message || 'You are not allowed to perform this action'],
      },
    })
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      ok: false,
      error: {
        message: 'Database validation failed',
        details: Object.values(err.errors || {}).map((item) => item.message),
      },
    })
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      ok: false,
      error: {
        message: 'Invalid database identifier',
        details: [err.message],
      },
    })
  }

  if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongooseServerSelectionError') {
    return res.status(503).json({
      ok: false,
      error: {
        message: 'Database unavailable',
        details: ['Could not connect to MongoDB. Please try again shortly.'],
      },
    })
  }

  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      error: {
        message: 'Invalid JSON body',
        details: ['Request body contains malformed JSON'],
      },
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: {
        message: err.message,
        details: err.details,
      },
    })
  }

  console.error('[error]', err)

  return res.status(500).json({
    ok: false,
    error: {
      message: 'Internal server error',
      details: [],
    },
  })
}

module.exports = errorHandler
