const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { 
  sendWelcomeEmail, 
  sendPasswordResetEmail 
} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { 
  validateRegistration, 
  validateLogin 
} = require('../utils/validation');
const { generateRandomToken } = require('../utils/helpers');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Student Signup
const studentSignup = async (req, res) => {
  try {
    const { studentId, pin, email, fullName, dateOfBirth, department } = req.body;

    // Validate input
    const { errors, isValid } = await validateRegistration(req.body, 'student');
    
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Create user
    const user = await User.create({
      userId: studentId,
      pin,
      email,
      fullName,
      dateOfBirth,
      department,
      role: 'student',
    });

    // Create student profile
    const student = await Student.create({
      user: user._id,
      studentId,
    });

    // Send welcome email
    await sendWelcomeEmail({
      email: user.email,
      fullName: user.fullName,
      userId: user.userId,
      role: user.role
    });

    // Create notification
    await createNotification({
      user: user._id,
      title: 'Welcome to Thesis Management System',
      message: 'Your account has been created successfully.',
      type: 'announcement',
    });

    res.status(201).json({
      _id: user._id,
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lecturer Signup
const lecturerSignup = async (req, res) => {
  try {
    const { staffId, pin, email, fullName, dateOfBirth, department, researchArea } = req.body;

    // Validate input
    const { errors, isValid } = await validateRegistration(req.body, 'lecturer');
    
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Create user
    const user = await User.create({
      userId: staffId,
      pin,
      email,
      fullName,
      dateOfBirth,
      department,
      role: 'lecturer',
    });

    // Create lecturer profile
    const lecturer = await Lecturer.create({
      user: user._id,
      staffId,
      department,
      researchArea,
    });

    // Send welcome email
    await sendWelcomeEmail({
      email: user.email,
      fullName: user.fullName,
      userId: user.userId,
      role: user.role
    });

    res.status(201).json({
      _id: user._id,
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { userId, pin } = req.body;

    // Validate input
    const { errors, isValid } = validateLogin(req.body);
    
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Check for user
    const user = await User.findOne({ userId });

    if (user && (await user.matchPin(pin))) {
      // Get role-specific data
      let profile;
      if (user.role === 'student') {
        profile = await Student.findOne({ user: user._id }).populate('supervisor');
      } else if (user.role === 'lecturer') {
        profile = await Lecturer.findOne({ user: user._id });
      } else if (user.role === 'admin') {
        profile = await Admin.findOne({ user: user._id });
      }

      res.json({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot PIN
const forgotPin = async (req, res) => {
  try {
    const { userId, email } = req.body;

    const user = await User.findOne({ userId, email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate temporary PIN
    const tempPin = Math.random().toString(36).slice(-8);
    user.pin = tempPin;
    await user.save();

    // Send email with temporary PIN
    await sendPasswordResetEmail(user, tempPin);

    res.json({ message: 'Temporary PIN sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change PIN
const changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPin(currentPin))) {
      return res.status(401).json({ message: 'Current PIN is incorrect' });
    }

    user.pin = newPin;
    await user.save();

    res.json({ message: 'PIN changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  studentSignup,
  lecturerSignup,
  login,
  forgotPin,
  changePin,
};