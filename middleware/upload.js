const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Storage for thesis submissions (documents)
const thesisStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'thesis-submissions',
    format: async (req, file) => 'pdf',
    public_id: (req, file) => {
      const filename = file.originalname.split('.')[0];
      return `${filename}-${Date.now()}`;
    },
  },
});

// Storage for profile pictures (images)
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pictures',
    format: async (req, file) => 'jpg', // Convert all images to jpg
    public_id: (req, file) => {
      return `profile-${req.user._id}-${Date.now()}`;
    },
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  },
});

// Upload middleware for thesis documents
const uploadThesis = multer({
  storage: thesisStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  },
});

// Upload middleware for profile pictures
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      // Allow common image formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
      }
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

module.exports = {
  uploadThesis,
  uploadProfilePicture,
};