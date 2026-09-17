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

const mockExtractRawText = jest.fn(async () => ({ value: 'Extracted DOCX text content.' }));
jest.unstable_mockModule('mammoth', () => ({
  default: { extractRawText: mockExtractRawText },
}));

const { uploadResume, deleteResume, extractText } = await import('../services/resumeService.js');

const MINIMAL_PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<< >>\nendobj\ntrailer\n<< >>\n%%EOF');

// A real, minimally-valid PDF with actual page content (pdf.js can render
// but not meaningfully index the header-only MINIMAL_PDF above).
const READABLE_PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    '<< /Length 44 >>',
    'stream',
    'BT /F1 24 Tf 50 100 Td (Hello World) Tj ET',
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    '%%EOF',
  ].join('\n')
);

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

describe('resumeService.extractText', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('extracts real text from a PDF via pdf-parse', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => READABLE_PDF.buffer.slice(READABLE_PDF.byteOffset, READABLE_PDF.byteOffset + READABLE_PDF.byteLength),
    }));

    const text = await extractText('https://example.com/resume.pdf', 'application/pdf');
    expect(text).toContain('Hello World');
  });

  it('extracts text from a DOCX via mammoth', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));

    const text = await extractText(
      'https://example.com/resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(text).toBe('Extracted DOCX text content.');
    expect(mockExtractRawText).toHaveBeenCalledTimes(1);
  });

  it('throws a 502 when the resume cannot be downloaded', async () => {
    global.fetch = jest.fn(async () => ({ ok: false }));

    await expect(extractText('https://example.com/missing.pdf', 'application/pdf')).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('throws a 422 when the PDF cannot be parsed', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('not a real pdf').buffer,
    }));

    await expect(extractText('https://example.com/broken.pdf', 'application/pdf')).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});
