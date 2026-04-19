const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['stub', 'generated'],
      default: 'stub',
    },
    generationStatus: {
      type: String,
      enum: ['idle', 'in_progress', 'failed', 'succeeded'],
      default: 'idle',
    },
    objectives: {
      type: [String],
      default: [],
    },
    content: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    readings: {
      type: [String],
      default: [],
    },
    videoQuery: {
      type: String,
      default: '',
      trim: true,
    },
    mcqs: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    hinglishExplanation: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Lesson', lessonSchema)
