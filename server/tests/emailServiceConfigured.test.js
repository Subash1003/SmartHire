import { jest } from '@jest/globals';

process.env.EMAIL_HOST = 'smtp.example.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'noreply@example.com';
process.env.EMAIL_PASSWORD = 'secret';

const mockSendMail = jest.fn(async () => ({ messageId: 'test-id' }));
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

const { sendPasswordResetEmail } = await import('../services/emailService.js');

describe('emailService when SMTP is configured', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it('sends via the nodemailer transporter', async () => {
    await sendPasswordResetEmail({ email: 'candidate@example.com', name: 'Jane' }, 'raw-token');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'candidate@example.com', subject: expect.stringContaining('Reset') })
    );
  });

  it('does not throw when sendMail rejects', async () => {
    mockSendMail.mockImplementationOnce(async () => {
      throw new Error('SMTP down');
    });

    await expect(
      sendPasswordResetEmail({ email: 'candidate@example.com', name: 'Jane' }, 'raw-token')
    ).resolves.toBeUndefined();
  });
});
