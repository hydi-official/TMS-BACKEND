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
} = require('../controllers/userController');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/students', authorize('lecturer', 'admin'), getStudents);
router.get('/lecturers', getLecturers);

router.post('/request-supervisor', authorize('student'), requestSupervisor);
router.put('/respond-request', authorize('lecturer'), respondToRequest);

module.exports = router;