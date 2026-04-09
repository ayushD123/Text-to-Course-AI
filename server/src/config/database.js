const mongoose = require('mongoose')

const connectDatabase = async ({ mongoUri }) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured. Please set it in server/.env')
  }

  console.log('[db] Connecting to MongoDB...')
  await mongoose.connect(mongoUri)
  console.log(`[db] Connected to MongoDB (${mongoose.connection.host})`)
}

module.exports = {
  connectDatabase,
}
