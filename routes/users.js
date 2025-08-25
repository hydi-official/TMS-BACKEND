const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getStudents,
  getLecturers,
  getLecturerStudents, // Added new import
  requestSupervisor,
  respondToRequest,
  getLecturerRequests,
  getUserRequests,
  assignStudentsToLecturer,
  bulkAssignStudents,
  getUnassignedStudents,
} = require('../controllers/userController');

router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// General data routes
router.get('/students', authorize('lecturer', 'admin'), getStudents);
router.get('/lecturers', getLecturers);

// NEW ROUTE: Get lecturer's students
router.get('/my-students', authorize('lecturer'), getLecturerStudents);

// Supervision request routes
router.post('/request-supervisor', authorize('student'), requestSupervisor);
router.put('/respond-request', authorize('lecturer'), respondToRequest);

// Get requests routes
router.get('/lecturer-requests', authorize('lecturer'), getLecturerRequests);
router.get('/my-requests', authorize('student'), getUserRequests);

// Admin assignment routes
router.get('/unassigned-students', authorize('admin'), getUnassignedStudents);
router.post('/assign-students', authorize('admin'), assignStudentsToLecturer);
router.post('/bulk-assign', authorize('admin'), bulkAssignStudents);

module.exports = router;