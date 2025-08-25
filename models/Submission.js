const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  stage: {
    type: String,
    enum: ['proposal', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'final'],
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true,
  },
  file: {
    url: String,
    public_id: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['not-submitted', 'submitted', 'under-review', 'accepted', 'rejected', 'needs-revision'],
    default: 'not-submitted',
  },
  grade: {
    type: Number,
    min: 0,
    max: 100,
  },
  feedback: {
    type: String,
  },
  submittedAt: {
    type: Date,
  },
  gradedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Submission', submissionSchema);