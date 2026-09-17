import { jest } from '@jest/globals';

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

const mockUpload = jest.fn(async () => ({ secure_url: 'https://res.cloudinary.com/test/raw/upload/resume.pdf', public_id: 'smarthire/resumes/u1/resume' }));
const mockDestroy = jest.fn(async () => ({ result: 'ok' }));

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  default: { uploader: { upload: mockUpload, destroy: mockDestroy } },
  isCloudinaryConfigured: true,
}));

const { uploadResume, deleteResume } = await import('../services/resumeService.js');

const MINIMAL_PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<< >>\nendobj\ntrailer\n<< >>\n%%EOF');

beforeEach(() => {
  mockUpload.mockClear();
  mockDestroy.mockClear();
});

describe('resumeService.uploadResume', () => {
  it('accepts a real PDF and uploads it to Cloudinary', async () => {
    const result = await uploadResume(
      { buffer: MINIMAL_PDF, originalname: 'resume.pdf', size: MINIMAL_PDF.length },
      { userId: 'u1' }
    );

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(result.url).toBe('https://res.cloudinary.com/test/raw/upload/resume.pdf');
    expect(result.fileType).toBe('application/pdf');
    expect(result.fileName).toBe('resume.pdf');
  });

  it('rejects a text file renamed to look like a PDF (magic-byte mismatch)', async () => {
    const fakeBuffer = Buffer.from('this is just plain text, not a real pdf');

    await expect(
      uploadResume({ buffer: fakeBuffer, originalname: 'resume.pdf', size: fakeBuffer.length }, { userId: 'u1' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('destroys the previous resume when replacing it', async () => {
    await uploadResume(
      { buffer: MINIMAL_PDF, originalname: 'resume.pdf', size: MINIMAL_PDF.length },
      { userId: 'u1', previousPublicId: 'smarthire/resumes/u1/old-resume' }
    );

    expect(mockDestroy).toHaveBeenCalledWith('smarthire/resumes/u1/old-resume', { resource_type: 'raw' });
  });
});

describe('resumeService.deleteResume', () => {
  it('calls Cloudinary destroy with the given publicId', async () => {
    await deleteResume('some-public-id');
    expect(mockDestroy).toHaveBeenCalledWith('some-public-id', { resource_type: 'raw' });
  });

  it('does nothing when publicId is falsy', async () => {
    await deleteResume(null);
    expect(mockDestroy).not.toHaveBeenCalled();
  });
});
