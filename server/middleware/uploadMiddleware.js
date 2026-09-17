import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_CLIENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_CLIENT_MIME_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only PDF and DOCX files are allowed'));
    }
    cb(null, true);
  },
});

export function uploadResume(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File must be 5MB or smaller'));
      }
      return next(new ApiError(400, 'File upload failed'));
    }
    if (err) return next(err);

    if (!req.file) {
      return next(new ApiError(400, 'A resume file is required'));
    }

    next();
  });
}

export { MAX_FILE_SIZE_BYTES };
