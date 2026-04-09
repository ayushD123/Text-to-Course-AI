const app = require('./app')
const { connectDatabase } = require('./config/database')
const env = require('./config/env')

const startServer = async () => {
  try {
    await connectDatabase({ mongoUri: env.MONGO_URI })

    app.listen(env.PORT, () => {
      console.log(`[api] Server running on port ${env.PORT} (${env.NODE_ENV})`)
    })
  } catch (error) {
    console.error('[startup] Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
