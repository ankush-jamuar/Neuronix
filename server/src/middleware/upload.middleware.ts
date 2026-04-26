import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

// ✅ FIXED STORAGE CONFIG
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "neuronix_uploads",
      resource_type: "image", // 🔥 Only images supported

      public_id: file.originalname,
      use_filename: true,
      unique_filename: false,

      // Ensure images are publicly accessible
      access_mode: "public",
      type: "upload",
    };
  },
});

// ✅ IMAGE-ONLY VALIDATION
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'));
  }
};

// ✅ FINAL MIDDLEWARE
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});