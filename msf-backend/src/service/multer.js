const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/slides');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage });