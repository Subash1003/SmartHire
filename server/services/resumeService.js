import { fileTypeFromBuffer } from 'file-type';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_REAL_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

async function verifyActualFileType(buffer) {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected || !ALLOWED_REAL_MIME_TYPES.has(detected.mime)) {
    throw new ApiError(400, 'The uploaded file does not appear to be a valid PDF or DOCX document');
  }

  return detected;
}

export async function uploadResume({ buffer, originalname, size }, { userId, previousPublicId } = {}) {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, 'Resume storage is not configured yet. Please try again later.');
  }

  const detected = await verifyActualFileType(buffer);

  const dataUri = `data:${detected.mime};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'raw',
    folder: `smarthire/resumes/${userId}`,
    use_filename: true,
    unique_filename: true,
  });

  if (previousPublicId) {
    try {
      await cloudinary.uploader.destroy(previousPublicId, { resource_type: 'raw' });
    } catch {
      // Best-effort cleanup; do not fail the upload if the old asset is already gone.
    }
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    fileName: originalname,
    fileType: detected.mime,
    fileSize: size,
    uploadedAt: new Date(),
  };
}

export async function deleteResume(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}

// Extracted on demand (never persisted) so AI screening can read a resume's
// text without keeping a standing plaintext copy in the database.
export async function extractText(url, fileType) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError(502, 'Unable to download the resume for screening.');
  }

  if (!response.ok) {
    throw new ApiError(502, 'Unable to download the resume for screening.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  try {
    if (fileType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch {
    throw new ApiError(422, 'Unable to read text from this resume file.');
  }
}
