const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  thesisTopic: {
    type: String,
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer',
  },
  progress: {
    type: Number,
    default: 0,
  },
  currentStage: {
    type: String,
    enum: ['proposal', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'final', 'completed'],
    default: 'proposal',
  },
  requestedSupervisors: [{
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecturer',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema);