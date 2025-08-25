const crypto = require('crypto');

// Generate random token
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Format date to readable string
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate days between two dates
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Check if date is in the past
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

// Generate progress percentage based on thesis stage
const calculateProgress = (stage) => {
  const stages = [
    'proposal', 'chapter1', 'chapter2', 'chapter3', 
    'chapter4', 'chapter5', 'chapter6', 'final', 'completed'
  ];
  
  const currentIndex = stages.indexOf(stage);
  return currentIndex >= 0 ? Math.round((currentIndex / (stages.length - 1)) * 100) : 0;
};

// Validate file type
const validateFileType = (file, allowedTypes = ['pdf', 'doc', 'docx']) => {
  const extension = file.originalname.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

// Validate file size
const validateFileSize = (file, maxSize = 10 * 1024 * 1024) => { // 10MB default
  return file.size <= maxSize;
};

// Extract user data from request
const getUserData = (req) => {
  return {
    id: req.user._id,
    userId: req.user.userId,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
    department: req.user.department,
  };
};

// Generate submission status based on deadline
const getSubmissionStatus = (submission) => {
  const now = new Date();
  const deadline = new Date(submission.deadline);
  
  if (submission.status === 'submitted') return 'submitted';
  if (now > deadline) return 'overdue';
  if (daysBetween(now, deadline) <= 3) return 'due-soon';
  return 'not-submitted';
};

module.exports = {
  generateRandomToken,
  formatDate,
  daysBetween,
  isPastDate,
  calculateProgress,
  validateFileType,
  validateFileSize,
  getUserData,
  getSubmissionStatus,
};