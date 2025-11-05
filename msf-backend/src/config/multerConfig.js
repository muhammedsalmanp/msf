// multer.js
import multer from 'multer';

// Use memory storage for uploading files
const storage = multer.memoryStorage();

const upload = multer({
  
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log("eterd muter")
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
    console.log("Done muter")
  },
});

export default upload;
