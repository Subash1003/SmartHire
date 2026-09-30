import { jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.GROQ_API_KEY = 'test-groq-key';

const mockScreenResume = jest.fn(async () => ({
  matchScore: 82,
  matchedSkills: ['React'],
  missingSkills: ['TypeScript'],
  experienceMatch: 85,
  educationMatch: 80,
  summary: 'Good overlap with the role requirements.',
  model: 'openai/gpt-oss-120b',
}));

jest.unstable_mockModule('../services/aiService.js', () => ({
  screenResume: mockScreenResume,
}));

// aiController also pulls extractText from resumeService; avoid a real
// network fetch + pdf-parse call by mocking it, while keeping the other
// exports available (candidateProfileController imports them too).
const mockExtractText = jest.fn(async () => 'Experienced React developer with 3 years building user interfaces.');

jest.unstable_mockModule('../services/resumeService.js', () => ({
  extractText: mockExtractText,
  uploadResume: jest.fn(),
  deleteResume: jest.fn(),
}));

const { setupTestApp } = await import('./setupTestApp.js');
const { extractCsrfToken } = await import('./testUtils.js');

let app;
let mongod;
let mongoose;
let Organization;
let User;
let Job;
let Application;
let CandidateProfile;
let AIScreening;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: Application } = await import('../models/Application.js'));
  ({ default: CandidateProfile } = await import('../models/CandidateProfile.js'));
  ({ default: AIScreening } = await import('../models/AIScreening.js'));
});

beforeEach(async () => {
  mockScreenResume.mockClear();
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await CandidateProfile.deleteMany({});
  await AIScreening.deleteMany({});
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

async function createApplicationFor(orgId, recruiterId) {
  const job = await Job.create({
    organizationId: orgId,
    createdBy: recruiterId,
    title: 'Frontend Developer',
    description: 'Build user interfaces.',
    requiredSkills: ['React'],
    employmentType: 'full-time',
    workMode: 'remote',
    status: 'published',
  });

  const { agent: candidateAgent, csrfToken, user: candidateUser } = await createAndLoginUser('candidate', orgId);
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

  const res = await candidateAgent.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
  return { applicationId: res.body.data.application._id, job };
}

describe('POST /api/v1/ai/resume-screen', () => {
  it('rejects candidate and interviewer roles', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);
    const { agent, csrfToken } = await createAndLoginUser('candidate');

    const res = await agent.post('/api/v1/ai/resume-screen').set('X-CSRF-Token', csrfToken).send({ applicationId });
    expect(res.status).toBe(403);
  });

  it('runs a screening for a recruiter and stores the result', async () => {
    const { agent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    const res = await agent.post('/api/v1/ai/resume-screen').set('X-CSRF-Token', csrfToken).send({ applicationId });

    expect(res.status).toBe(201);
    expect(res.body.data.screening.matchScore).toBe(82);
    expect(mockScreenResume).toHaveBeenCalledTimes(1);

    const stored = await AIScreening.findOne({ applicationId });
    expect(stored).not.toBeNull();
    expect(stored.matchedSkills).toEqual(['React']);
  });

  it('re-screening upserts rather than creating a second record', async () => {
    const { agent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    await agent.post('/api/v1/ai/resume-screen').set('X-CSRF-Token', csrfToken).send({ applicationId });
    await agent.post('/api/v1/ai/resume-screen').set('X-CSRF-Token', csrfToken).send({ applicationId });

    const count = await AIScreening.countDocuments({ applicationId });
    expect(count).toBe(1);
  });

  it('blocks a recruiter from a different org from screening the application', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherAgent, csrfToken: otherCsrf } = await createAndLoginUser('recruiter', otherOrg._id);

    const res = await otherAgent.post('/api/v1/ai/resume-screen').set('X-CSRF-Token', otherCsrf).send({ applicationId });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/ai/screenings/:applicationId', () => {
  it('returns 404 when no screening exists yet', async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    const res = await agent.get(`/api/v1/ai/screenings/${applicationId}`);
    expect(res.status).toBe(404);
  });

  it('returns the stored screening after one has been run', async () => {
    const { agent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    await agent.post('/api/v1/ai/resume-screen').set('X-CSRF-Token', csrfToken).send({ applicationId });

    const res = await agent.get(`/api/v1/ai/screenings/${applicationId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.screening.summary).toBe('Good overlap with the role requirements.');
  });
});
