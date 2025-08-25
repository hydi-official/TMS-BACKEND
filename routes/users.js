const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  removeProfilePicture,
  getStudents,
  getLecturers,
  getLecturerStudents,
  requestSupervisor,
  respondToRequest,
  getLecturerRequests,
  getUserRequests,
  assignStudentsToLecturer,
  bulkAssignStudents,
  getUnassignedStudents
} = require('../controllers/userController');
const { uploadProfilePicture } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// Apply protection middleware to all routes
router.use(protect);

// ==================== PROFILE ROUTES ====================

// Get current user profile
router.get('/profile', getProfile);

// Update profile with optional profile picture upload
router.put('/profile',
  uploadProfilePicture.single('profilePicture'), // Handle profile picture upload
  updateProfile
);

// Remove profile picture
router.delete('/profile/picture', removeProfilePicture);

// ==================== USER DATA ROUTES ====================

// Get all students (accessible by admin and lecturer)
router.get('/students', authorize('admin', 'lecturer'), getStudents);

// Get all lecturers (accessible by all authenticated users)
router.get('/lecturers', getLecturers);

// Get lecturer's assigned students
router.get('/lecturer/students', authorize('lecturer'), getLecturerStudents);

// Alternative route for lecturer's students (more RESTful naming)
router.get('/my-students', authorize('lecturer'), getLecturerStudents);

// Get unassigned students (admin only)
router.get('/unassigned-students', authorize('admin'), getUnassignedStudents);

// ==================== SUPERVISION REQUEST ROUTES ====================

// Student requests supervisor
router.post('/request-supervisor', authorize('student'), requestSupervisor);

// Lecturer responds to supervision request
router.put('/respond-request', authorize('lecturer'), respondToRequest);

// Get supervision requests for lecturer
router.get('/lecturer/requests', authorize('lecturer'), getLecturerRequests);

// Alternative route for lecturer requests (more RESTful naming)
router.get('/lecturer-requests', authorize('lecturer'), getLecturerRequests);

// Get user's own supervision requests (students only)
router.get('/user/requests', authorize('student'), getUserRequests);

// Alternative route for user requests (more RESTful naming)
router.get('/my-requests', authorize('student'), getUserRequests);

// ==================== ADMIN ASSIGNMENT ROUTES ====================

// Assign multiple students to a single lecturer
router.post('/assign-students', authorize('admin'), assignStudentsToLecturer);

// Bulk assign multiple students to multiple lecturers
router.post('/bulk-assign-students', authorize('admin'), bulkAssignStudents);

// Alternative route for bulk assignment (shorter naming)
router.post('/bulk-assign', authorize('admin'), bulkAssignStudents);

module.exports = router;