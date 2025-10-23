const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || require('./config').MONGO_URI
    const conn = await mongoose.connect(uri)

    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    if (process.env.NODE_ENV === 'production') {
      // In production we should exit to ensure process manager restarts or fails fast
      process.exit(1)
    } else {
      // In development, continue running so nodemon can restart after fixes
      console.warn('Continuing without a DB connection in development mode. Some features will be disabled until the DB is available.')
    }
  }
}

module.exports = connectDB
