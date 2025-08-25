const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminId: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
  },
  role: {
    type: String,
    enum: ['coordinator', 'superadmin'],
    default: 'coordinator',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Admin', adminSchema);