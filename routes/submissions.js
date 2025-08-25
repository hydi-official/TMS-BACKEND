const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createSubmission,
  getSubmissions,
  submitWork,
  gradeSubmission,
} = require('../controllers/submissionController');

router.use(protect);

router.get('/', getSubmissions);
router.post('/', authorize('lecturer'), createSubmission);
router.post('/:id/submit', authorize('student'), upload.single('file'), submitWork);
router.put('/:id/grade', authorize('lecturer'), gradeSubmission);

module.exports = router;