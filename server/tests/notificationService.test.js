import { jest } from '@jest/globals';
import { setupTestApp } from './setupTestApp.js';

let mongod;
let mongoose;
let Notification;
let createNotification;

beforeAll(async () => {
  ({ mongod, mongoose } = await setupTestApp());
  ({ default: Notification } = await import('../models/Notification.js'));
  ({ createNotification } = await import('../services/notificationService.js'));
});

beforeEach(async () => {
  await Notification.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('notificationService.createNotification', () => {
  it('creates a notification document', async () => {
    const organizationId = new mongoose.Types.ObjectId();
    const recipientId = new mongoose.Types.ObjectId();
    const resourceId = new mongoose.Types.ObjectId();

    await createNotification({
      organizationId,
      recipientId,
      type: 'interview_scheduled',
      title: 'Interview scheduled',
      message: 'An interview has been scheduled',
      resourceType: 'interview',
      resourceId,
    });

    const stored = await Notification.findOne({ recipientId });
    expect(stored).not.toBeNull();
    expect(stored.isRead).toBe(false);
    expect(stored.relatedResource.resourceType).toBe('interview');
  });

  it('does not throw when the write fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      createNotification({
        organizationId: new mongoose.Types.ObjectId(),
        recipientId: new mongoose.Types.ObjectId(),
        type: 'not_a_real_type',
        title: 'Bad type',
        message: 'This should fail validation',
      })
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
