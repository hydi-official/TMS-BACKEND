const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadThesis } = require('../middleware/upload'); // Import the correct named export
const {
  createSubmission,
  getSubmissions,
  submitWork,
  gradeSubmission,
} = require('../controllers/submissionController');

// Apply authentication middleware to all routes
router.use(protect);

// Get all submissions
router.get('/', getSubmissions);

// Create new submission (lecturer only)
router.post('/', authorize('lecturer'), createSubmission);

// Submit work to a submission (student only) - using uploadThesis for document uploads
router.post('/:id/submit', authorize('student'), uploadThesis.single('file'), submitWork);

// Grade a submission (lecturer only)
router.put('/:id/grade', authorize('lecturer'), gradeSubmission);

module.exports = router;