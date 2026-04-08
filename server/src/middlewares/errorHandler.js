const AppError = require('../utils/appError')

const errorHandler = (err, req, res, next) => {
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

  return res.status(500).json({
    ok: false,
    error: {
      message: 'Internal server error',
      details: [],
    },
  })
}

module.exports = errorHandler
