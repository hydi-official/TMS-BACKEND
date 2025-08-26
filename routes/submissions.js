const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadThesis } = require('../middleware/upload'); // Import the correct named export
const {
  createSubmission,
  getSubmissions,
  getMySubmissions, // Add the new function import
  submitWork,
  gradeSubmission,
} = require('../controllers/submissionController');

// Apply authentication middleware to all routes
router.use(protect);

// Get all submissions (for lecturers - gets their supervised students' submissions)
router.get('/', getSubmissions);

// Get current user's own submissions (for students - gets their own submissions only)
router.get('/my-submissions', authorize('student'), getMySubmissions);

// Create new submission (lecturer only)
router.post('/', authorize('lecturer'), createSubmission);

// Submit work to a submission (student only) - using uploadThesis for document uploads
router.post('/:id/submit', authorize('student'), uploadThesis.single('file'), submitWork);

// Grade a submission (lecturer only)
router.put('/:id/grade', authorize('lecturer'), gradeSubmission);

module.exports = router;