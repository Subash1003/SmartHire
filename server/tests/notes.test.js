import request from 'supertest';
import bcrypt from 'bcryptjs';
import { setupTestApp } from './setupTestApp.js';
import { extractCsrfToken } from './testUtils.js';

let app;
let mongod;
let mongoose;
let Organization;
let User;
let Job;
let Application;
let CandidateProfile;
let Note;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: Application } = await import('../models/Application.js'));
  ({ default: CandidateProfile } = await import('../models/CandidateProfile.js'));
  ({ default: Note } = await import('../models/Note.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await CandidateProfile.deleteMany({});
  await Note.deleteMany({});
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
    title: 'Backend Developer',
    description: 'Build the API.',
    requiredSkills: ['Node.js'],
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
  return { applicationId: res.body.data.application._id, candidateUser, candidateAgent };
}

describe('POST /api/v1/applications/:id/notes', () => {
  it('rejects candidate role', async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId, candidateAgent } = await createApplicationFor(organization._id, recruiter._id);

    const res = await candidateAgent.post(`/api/v1/applications/${applicationId}/notes`).send({ content: 'trying to add a note' });
    expect(res.status).toBe(403);
  });

  it('allows a recruiter to add a private note', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    const res = await recruiterAgent
      .post(`/api/v1/applications/${applicationId}/notes`)
      .set('X-CSRF-Token', csrfToken)
      .send({ content: 'Strong React experience, move to next round.' });

    expect(res.status).toBe(201);
    expect(res.body.data.note.content).toBe('Strong React experience, move to next round.');
    expect(res.body.data.note.authorId.name).toBe(recruiter.name);
  });

  it('blocks a recruiter from a different org from adding a note', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherRecruiter, csrfToken: otherCsrf } = await createAndLoginUser('recruiter', otherOrg._id);
    const res = await otherRecruiter
      .post(`/api/v1/applications/${applicationId}/notes`)
      .set('X-CSRF-Token', otherCsrf)
      .send({ content: 'should not be allowed' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/applications/:id/notes', () => {
  it('rejects candidate role, so a candidate can never see recruiter notes', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId, candidateAgent } = await createApplicationFor(organization._id, recruiter._id);

    await recruiterAgent
      .post(`/api/v1/applications/${applicationId}/notes`)
      .set('X-CSRF-Token', csrfToken)
      .send({ content: 'private recruiter note' });

    const res = await candidateAgent.get(`/api/v1/applications/${applicationId}/notes`);
    expect(res.status).toBe(403);
  });

  it('lists notes newest first for the owning org', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);

    await recruiterAgent.post(`/api/v1/applications/${applicationId}/notes`).set('X-CSRF-Token', csrfToken).send({ content: 'first note' });
    await recruiterAgent.post(`/api/v1/applications/${applicationId}/notes`).set('X-CSRF-Token', csrfToken).send({ content: 'second note' });

    const res = await recruiterAgent.get(`/api/v1/applications/${applicationId}/notes`);
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toHaveLength(2);
    expect(res.body.data.notes[0].content).toBe('second note');
  });
});
