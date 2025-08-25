const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for thesis submissions (documents)
const thesisStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'thesis-submissions',
    format: async (req, file) => 'pdf', // supports other formats as well
    public_id: (req, file) => {
      const filename = file.originalname.split('.')[0];
      return `${filename}-${Date.now()}`;
    },
    resource_type: 'raw', // For non-image files like PDFs
  },
});

// Storage configuration for profile pictures (images)
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pictures',
    format: async (req, file) => 'jpg', // Convert all images to jpg for consistency
    public_id: (req, file) => {
      return `profile-${req.user._id}-${Date.now()}`;
    },
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' }, // Square crop focused on face
      { quality: 'auto', fetch_format: 'auto' } // Auto-optimize quality and format
    ],
    resource_type: 'image', // For image files
  },
});

// Helper function to delete files from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: resourceType 
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, finalOptions);
};

module.exports = {
  cloudinary,
  thesisStorage,
  profilePictureStorage,
  deleteFromCloudinary,
  getOptimizedImageUrl,
};