const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getStudents,
  getLecturers,
  requestSupervisor,
  respondToRequest,
  getLecturerRequests,
  getUserRequests,
} = require('../controllers/userController');

router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// General data routes
router.get('/students', authorize('lecturer', 'admin'), getStudents);
router.get('/lecturers', getLecturers);

// Supervision request routes
router.post('/request-supervisor', authorize('student'), requestSupervisor);
router.put('/respond-request', authorize('lecturer'), respondToRequest);

// NEW: Get requests routes
router.get('/lecturer-requests', authorize('lecturer'), getLecturerRequests);
router.get('/my-requests', authorize('student'), getUserRequests);

module.exports = router;