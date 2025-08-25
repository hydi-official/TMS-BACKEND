const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'thesis-submissions',
    format: async (req, file) => 'pdf', // supports other formats as well
    public_id: (req, file) => {
      const filename = file.originalname.split('.')[0];
      return `${filename}-${Date.now()}`;
    },
  },
});

module.exports = {
  cloudinary,
  storage,
};