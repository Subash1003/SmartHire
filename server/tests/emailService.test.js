import { jest } from '@jest/globals';

process.env.EMAIL_HOST = '';
process.env.EMAIL_USER = '';
process.env.EMAIL_PASSWORD = '';

const mockSendMail = jest.fn(async () => ({ messageId: 'test-id' }));
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

const { sendVerificationEmail } = await import('../services/emailService.js');

describe('emailService when SMTP is not configured', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('logs to the console instead of sending', async () => {
    await sendVerificationEmail({ email: 'candidate@example.com', name: 'Jane' }, 'raw-token');

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });
});
