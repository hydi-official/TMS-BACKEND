const mongoose = require('mongoose');

const thesisSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
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
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'defended', 'archived'],
    default: 'in-progress',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expectedEndDate: {
    type: Date,
  },
  actualEndDate: {
    type: Date,
  },
  finalGrade: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Thesis', thesisSchema);