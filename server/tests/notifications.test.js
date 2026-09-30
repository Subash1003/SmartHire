import request from 'supertest';
import bcrypt from 'bcryptjs';
import { setupTestApp } from './setupTestApp.js';
import { extractCsrfToken } from './testUtils.js';

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

let app;
let mongod;
let mongoose;
let Organization;
let User;
let Job;
let CandidateProfile;
let Notification;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: CandidateProfile } = await import('../models/CandidateProfile.js'));
  ({ default: Notification } = await import('../models/Notification.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await CandidateProfile.deleteMany({});
  await Notification.deleteMany({});
  organization = await Organization.create({ name: 'Acme Corp' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createAndLoginUser(role, orgId = organization._id) {
  const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
  const user = await User.create({
    organizationId: orgId,
    name: `Test ${role}`,
    email: `${role}-${new mongoose.Types.ObjectId()}@example.com`,
    passwordHash,
    role,
  });

  const agent = request.agent(app);
  const loginRes = await agent.post('/api/v1/auth/login').send({ email: user.email, password: 'Str0ngPass1' });
  return { agent, csrfToken: extractCsrfToken(loginRes), user };
}

describe('notifications', () => {
  it('a candidate sees a "new application" flow generate a notification for the recruiter, and a confirmation implicitly for themselves', async () => {
    const { user: recruiter, agent: recruiterAgent } = await createAndLoginUser('recruiter');
    const job = await Job.create({
      organizationId: organization._id,
      createdBy: recruiter._id,
      title: 'Backend Developer',
      description: 'Build the API.',
      requiredSkills: ['Node.js'],
      employmentType: 'full-time',
      workMode: 'remote',
      status: 'published',
    });

    const { agent: candidateAgent, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await CandidateProfile.create({
      userId: candidateUser._id,
      resume: {
        url: 'https://res.cloudinary.com/test/raw/upload/resume.pdf',
        publicId: 'smarthire/resumes/x/resume',
        fileName: 'resume.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedAt: new Date(),
      },
    });

    const applyRes = await candidateAgent.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    expect(applyRes.status).toBe(201);

    const recruiterNotifications = await recruiterAgent.get('/api/v1/notifications');
    expect(recruiterNotifications.status).toBe(200);
    expect(recruiterNotifications.body.data.notifications).toHaveLength(1);
    expect(recruiterNotifications.body.data.notifications[0].type).toBe('new_application');
    expect(recruiterNotifications.body.data.unreadCount).toBe(1);
  });

  it('only returns the authenticated user\'s own notifications', async () => {
    const { user: recruiterA } = await createAndLoginUser('recruiter');
    const { agent: recruiterBAgent } = await createAndLoginUser('recruiter');

    await Notification.create({
      organizationId: organization._id,
      recipientId: recruiterA._id,
      type: 'new_application',
      title: 'New application received',
      message: 'Someone applied',
    });

    const res = await recruiterBAgent.get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toHaveLength(0);
  });

  it('marks a single notification as read', async () => {
    const { agent, csrfToken, user } = await createAndLoginUser('recruiter');
    const notification = await Notification.create({
      organizationId: organization._id,
      recipientId: user._id,
      type: 'new_application',
      title: 'New application received',
      message: 'Someone applied',
    });

    const res = await agent.patch(`/api/v1/notifications/${notification._id}/read`).set('X-CSRF-Token', csrfToken);
    expect(res.status).toBe(200);
    expect(res.body.data.notification.isRead).toBe(true);
  });

  it('cannot mark another user\'s notification as read', async () => {
    const { user: owner } = await createAndLoginUser('recruiter');
    const { agent: otherAgent, csrfToken: otherCsrf } = await createAndLoginUser('recruiter');

    const notification = await Notification.create({
      organizationId: organization._id,
      recipientId: owner._id,
      type: 'new_application',
      title: 'New application received',
      message: 'Someone applied',
    });

    const res = await otherAgent.patch(`/api/v1/notifications/${notification._id}/read`).set('X-CSRF-Token', otherCsrf);
    expect(res.status).toBe(404);
  });

  it('marks all notifications as read', async () => {
    const { agent, csrfToken, user } = await createAndLoginUser('recruiter');
    await Notification.create([
      { organizationId: organization._id, recipientId: user._id, type: 'new_application', title: 'A', message: 'a' },
      { organizationId: organization._id, recipientId: user._id, type: 'new_application', title: 'B', message: 'b' },
    ]);

    const res = await agent.patch('/api/v1/notifications/read-all').set('X-CSRF-Token', csrfToken);
    expect(res.status).toBe(200);

    const listRes = await agent.get('/api/v1/notifications?unreadOnly=true');
    expect(listRes.body.data.notifications).toHaveLength(0);
  });
});
