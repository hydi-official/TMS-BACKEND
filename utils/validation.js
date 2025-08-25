const validator = require('validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');

// Validate email format
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

// Validate password strength
const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
  });
};

// Validate image file type
const isValidImageFile = (file) => {
  if (!file) return true; // No file is valid (optional)
  
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp'
  ];
  
  return allowedMimeTypes.includes(file.mimetype);
};

// Validate image file size (5MB limit)
const isValidImageSize = (file) => {
  if (!file) return true; // No file is valid (optional)
  
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSizeInBytes;
};

// Validate user registration data
// Updated validation function to be more flexible
const validateRegistration = async (data, role) => {
  const errors = {};
  
  // Check required fields - handle both userId and studentId/staffId
  const idField = role === 'student' ? 'studentId' : 'staffId';
  const userIdValue = data.userId || data[idField];
  
  if (!userIdValue) {
    errors.userId = `${role === 'student' ? 'Student' : 'Staff'} ID is required`;
  }
  
  if (!data.pin) {
    errors.pin = 'PIN is required';
  } else if (data.pin.length < 4) {
    errors.pin = 'PIN must be at least 4 characters';
  }
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Email is invalid';
  }
  
  if (!data.fullName) {
    errors.fullName = 'Full name is required';
  }
  
  if (!data.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else if (!validator.isDate(data.dateOfBirth)) {
    errors.dateOfBirth = 'Date of birth is invalid';
  }
  
  if (role === 'lecturer' && !data.department) {
    errors.department = 'Department is required for lecturers';
  }
  
  // Check if user already exists (only if we have a valid ID)
  if (userIdValue) {
    const userExists = await User.findOne({ 
      $or: [{ userId: userIdValue }, { email: data.email }] 
    });
    
    if (userExists) {
      if (userExists.userId === userIdValue) {
        errors.userId = `${role === 'student' ? 'Student' : 'Staff'} ID already exists`;
      }
      if (userExists.email === data.email) {
        errors.email = 'Email already exists';
      }
    }
  }
  
  // University database validation (if needed)
  if (role === 'lecturer' && userIdValue) {
    const universityStaff = ['LEC001', 'LEC002', 'LEC003'];
    if (!universityStaff.includes(userIdValue)) {
      errors.userId = 'Staff ID not found in university database';
    }
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate login data
const validateLogin = (data) => {
  const errors = {};
  
  if (!data.userId) {
    errors.userId = 'User ID is required';
  }
  
  if (!data.pin) {
    errors.pin = 'PIN is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate thesis data
const validateThesis = (data) => {
  const errors = {};
  
  if (!data.title) {
    errors.title = 'Thesis title is required';
  } else if (data.title.length < 5) {
    errors.title = 'Thesis title must be at least 5 characters';
  }
  
  if (!data.studentId) {
    errors.studentId = 'Student ID is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate submission data
const validateSubmission = (data) => {
  const errors = {};
  
  if (!data.title) {
    errors.title = 'Submission title is required';
  }
  
  if (!data.stage) {
    errors.stage = 'Submission stage is required';
  }
  
  if (!data.deadline) {
    errors.deadline = 'Deadline is required';
  } else if (!validator.isDate(data.deadline)) {
    errors.deadline = 'Deadline must be a valid date';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate message data
const validateMessage = (data) => {
  const errors = {};
  
  if (!data.message) {
    errors.message = 'Message is required';
  } else if (data.message.length > 1000) {
    errors.message = 'Message must be less than 1000 characters';
  }
  
  if (!data.receiverId && !data.groupId) {
    errors.recipient = 'Either receiverId or groupId is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate announcement data
const validateAnnouncement = (data) => {
  const errors = {};
  
  if (!data.title) {
    errors.title = 'Announcement title is required';
  }
  
  if (!data.message) {
    errors.message = 'Announcement message is required';
  }
  
  if (!data.targetAudience) {
    errors.targetAudience = 'Target audience is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate profile update data (including profile picture)
const validateProfileUpdate = (data, role, file = null) => {
  const errors = {};
  
  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Email is invalid';
  }
  
  if (data.fullName && data.fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  
  if (role === 'student' && data.thesisTopic && data.thesisTopic.length < 5) {
    errors.thesisTopic = 'Thesis topic must be at least 5 characters';
  }
  
  if (role === 'lecturer' && data.researchArea && data.researchArea.length < 3) {
    errors.researchArea = 'Research area must be at least 3 characters';
  }
  
  // Validate profile picture if provided
  if (file) {
    if (!isValidImageFile(file)) {
      errors.profilePicture = 'Invalid image file type. Only JPEG, PNG, GIF, and WebP are allowed';
    }
    
    if (!isValidImageSize(file)) {
      errors.profilePicture = 'Image file size must be less than 5MB';
    }
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate profile picture upload specifically
const validateProfilePictureUpload = (file) => {
  const errors = {};
  
  if (!file) {
    errors.profilePicture = 'Profile picture file is required';
    return {
      errors,
      isValid: false
    };
  }
  
  if (!isValidImageFile(file)) {
    errors.profilePicture = 'Invalid image file type. Only JPEG, PNG, GIF, and WebP are allowed';
  }
  
  if (!isValidImageSize(file)) {
    errors.profilePicture = 'Image file size must be less than 5MB';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  isValidImageFile,
  isValidImageSize,
  validateRegistration,
  validateLogin,
  validateThesis,
  validateSubmission,
  validateMessage,
  validateAnnouncement,
  validateProfileUpdate,
  validateProfilePictureUpload,
};