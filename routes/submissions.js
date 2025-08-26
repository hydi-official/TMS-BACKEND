const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadThesis } = require('../middleware/upload');
const Student = require('../models/Student'); // Add this for the middleware function
const {
  createSubmission,
  getSubmissions,
  getMySubmissions,
  submitWork,
  gradeSubmission,
  getMyGrades, // Add this
  getStudentGradeReport, // Add this
} = require('../controllers/submissionController');

// Apply authentication middleware to all routes
router.use(protect);

// Get all submissions (for lecturers - gets their supervised students' submissions)
router.get('/', getSubmissions);

// Get current user's own submissions (for students - gets their own submissions only)
router.get('/my-submissions', authorize('student'), getMySubmissions);

// Get current student's grades (students only)
router.get('/my-grades', authorize('student'), getMyGrades);

// Alternative route name for grades
router.get('/grades/me', authorize('student'), getMyGrades);

// Get current student's detailed grade report (shortcut route)
router.get('/my-grade-report', authorize('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Set the studentId parameter and call the main function
    req.params.studentId = student._id.toString();
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}, getStudentGradeReport);

// Get detailed grade report for a specific student
// Students can only view their own, lecturers can view their supervised students, admin can view any
router.get('/grade-report/:studentId', authorize('student', 'lecturer', 'admin'), getStudentGradeReport);

// Create new submission (lecturer only)
router.post('/', authorize('lecturer'), createSubmission);

// Submit work to a submission (student only) - using uploadThesis for document uploads
router.post('/:id/submit', authorize('student'), uploadThesis.single('file'), submitWork);

// Grade a submission (lecturer only)
router.put('/:id/grade', authorize('lecturer'), gradeSubmission);

module.exports = router;