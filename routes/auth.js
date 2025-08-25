const express = require('express');
const router = express.Router();
const {
  studentSignup,
  lecturerSignup,
  login,
  forgotPin,
  changePin,
} = require('../controllers/authController');

router.post('/student/signup', studentSignup);
router.post('/lecturer/signup', lecturerSignup);
router.post('/login', login);
router.post('/forgot-pin', forgotPin);
router.post('/change-pin', changePin);

module.exports = router;