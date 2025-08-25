const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  staffId: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
  },
  researchArea: {
    type: String,
  },
  maxStudents: {
    type: Number,
    default: 5,
  },
  currentStudents: {
    type: Number,
    default: 0,
  },
  isAcceptingStudents: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lecturer', lecturerSchema);