const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  try {
    // Check if authorization header exists
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Extract token
    const token = req.headers.authorization.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    req.user = await User.findById(decoded.id).select('-pin');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Get role-specific data
    if (req.user.role === 'student') {
      req.student = await Student.findOne({ user: req.user._id }).populate('supervisor');
    } else if (req.user.role === 'lecturer') {
      req.lecturer = await Lecturer.findOne({ user: req.user._id });
    } else if (req.user.role === 'admin') {
      req.admin = await Admin.findOne({ user: req.user._id });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize };