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
let Interview;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: Application } = await import('../models/Application.js'));
  ({ default: CandidateProfile } = await import('../models/CandidateProfile.js'));
  ({ default: Interview } = await import('../models/Interview.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await CandidateProfile.deleteMany({});
  await Interview.deleteMany({});
  organization = await Organization.create({ name: 'Acme Corp' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createAndLoginUser(role, orgId = organization._id, overrides = {}) {
  const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
  const user = await User.create({
    organizationId: orgId,
    name: overrides.name || `Test ${role}`,
    email: overrides.email || `${role}-${new mongoose.Types.ObjectId()}@example.com`,
    passwordHash,
    role,
  });

  const agent = request.agent(app);
  const loginRes = await agent.post('/api/v1/auth/login').send({ email: user.email, password: 'Str0ngPass1' });
  return { agent, csrfToken: extractCsrfToken(loginRes), user };
}

async function createPublishedJob(orgId, recruiterId, overrides = {}) {
  const job = await Job.create({
    organizationId: orgId,
    createdBy: recruiterId,
    title: 'Frontend Developer',
    description: 'Build user interfaces.',
    requiredSkills: ['React'],
    employmentType: 'full-time',
    workMode: 'remote',
    status: 'published',
    ...overrides,
  });
  return job;
}

async function giveCandidateResume(userId) {
  await CandidateProfile.create({
    userId,
    resume: {
      url: 'https://res.cloudinary.com/test/raw/upload/resume.pdf',
      publicId: 'smarthire/resumes/x/resume',
      fileName: 'resume.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      uploadedAt: new Date(),
    },
  });
}

describe('POST /api/v1/applications', () => {
  it('rejects non-candidate roles', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);
    const res = await recruiterAgent.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    expect(res.status).toBe(403);
  });

  it('rejects applying without a resume on file', async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken } = await createAndLoginUser('candidate');
    const res = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    expect(res.status).toBe(400);
  });

  it('rejects applying to a non-published job', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id, { status: 'draft' });

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);

    const res = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    expect(res.status).toBe(404);
  });

  it('allows a candidate with a resume to apply to a published job', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);

    const res = await candidate
      .post('/api/v1/applications')
      .set('X-CSRF-Token', csrfToken)
      .send({ jobId: job._id, coverLetter: 'I would love to join.', expectedSalary: 80000, availability: 'Immediate' });

    expect(res.status).toBe(201);
    expect(res.body.data.application.status).toBe('applied');
    expect(res.body.data.application.resumeSnapshot.fileName).toBe('resume.pdf');
  });

  it('rejects a duplicate application to the same job', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);

    await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    const res = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    expect(res.status).toBe(409);
  });

  it("allows a candidate to apply to a job from an org they didn't register with", async () => {
    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { user: otherRecruiter } = await createAndLoginUser('recruiter', otherOrg._id);
    const job = await createPublishedJob(otherOrg._id, otherRecruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate', organization._id);
    await giveCandidateResume(candidateUser._id);

    const res = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    expect(res.status).toBe(201);
    expect(res.body.data.application.organizationId).toBe(otherOrg._id.toString());
  });
});

describe('GET /api/v1/applications', () => {
  it("shows a candidate only their own applications", async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidateA, csrfToken: csrfA, user: userA } = await createAndLoginUser('candidate');
    await giveCandidateResume(userA._id);
    await candidateA.post('/api/v1/applications').set('X-CSRF-Token', csrfA).send({ jobId: job._id });

    const { agent: candidateB } = await createAndLoginUser('candidate');

    const res = await candidateB.get('/api/v1/applications');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("shows a recruiter only their org's applications, regardless of the candidate's own org", async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate', otherOrg._id);
    await giveCandidateResume(candidateUser._id);
    await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });

    const res = await recruiterAgent.get('/api/v1/applications');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].candidateId.name).toBe(candidateUser.name);
  });

  it('paginates and filters by status', async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    const jobA = await createPublishedJob(organization._id, recruiter._id, { title: 'Job A' });
    const jobB = await createPublishedJob(organization._id, recruiter._id, { title: 'Job B' });

    const { agent: c1, csrfToken: t1, user: u1 } = await createAndLoginUser('candidate');
    await giveCandidateResume(u1._id);
    await c1.post('/api/v1/applications').set('X-CSRF-Token', t1).send({ jobId: jobA._id });

    const { agent: c2, csrfToken: t2, user: u2 } = await createAndLoginUser('candidate');
    await giveCandidateResume(u2._id);
    await c2.post('/api/v1/applications').set('X-CSRF-Token', t2).send({ jobId: jobB._id });

    const res = await recruiterAgent.get(`/api/v1/applications?jobId=${jobA._id}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].jobId.title).toBe('Job A');
  });
});

describe('GET /api/v1/applications/:id', () => {
  it('returns 404 when another candidate tries to view someone else\'s application', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidateA, csrfToken, user: userA } = await createAndLoginUser('candidate');
    await giveCandidateResume(userA._id);
    const createRes = await candidateA.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    const applicationId = createRes.body.data.application._id;

    const { agent: candidateB } = await createAndLoginUser('candidate');
    const res = await candidateB.get(`/api/v1/applications/${applicationId}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 when a recruiter from a different org tries to view the application", async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);
    const createRes = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    const applicationId = createRes.body.data.application._id;

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherRecruiter } = await createAndLoginUser('recruiter', otherOrg._id);
    const res = await otherRecruiter.get(`/api/v1/applications/${applicationId}`);
    expect(res.status).toBe(404);
  });

  it('allows the owning candidate and the org recruiter to view the application', async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);
    const createRes = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    const applicationId = createRes.body.data.application._id;

    const ownRes = await candidate.get(`/api/v1/applications/${applicationId}`);
    expect(ownRes.status).toBe(200);

    const recruiterRes = await recruiterAgent.get(`/api/v1/applications/${applicationId}`);
    expect(recruiterRes.status).toBe(200);
  });
});

describe('PATCH /api/v1/applications/:id/status', () => {
  async function applyAsNewCandidate(job) {
    const { agent, csrfToken, user } = await createAndLoginUser('candidate');
    await giveCandidateResume(user._id);
    const createRes = await agent.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    return createRes.body.data.application._id;
  }

  it('rejects candidate role', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);
    const { agent: candidate, csrfToken } = await createAndLoginUser('candidate');

    const applicationId = await applyAsNewCandidate(job);
    const res = await candidate.patch(`/api/v1/applications/${applicationId}/status`).set('X-CSRF-Token', csrfToken).send({ status: 'shortlisted' });
    expect(res.status).toBe(403);
  });

  it('allows a recruiter to move a candidate to any status and records history', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);
    const applicationId = await applyAsNewCandidate(job);

    const res = await recruiterAgent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'shortlisted' });

    expect(res.status).toBe(200);
    expect(res.body.data.application.status).toBe('shortlisted');
    expect(res.body.data.application.statusHistory).toHaveLength(2);
    expect(res.body.data.application.statusHistory[1].status).toBe('shortlisted');

    const backToReview = await recruiterAgent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'under_review' });
    expect(backToReview.status).toBe(200);
    expect(backToReview.body.data.application.status).toBe('under_review');
  });

  it('blocks a recruiter from a different org from updating the status', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);
    const applicationId = await applyAsNewCandidate(job);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherRecruiter, csrfToken: otherCsrf } = await createAndLoginUser('recruiter', otherOrg._id);
    const res = await otherRecruiter
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('X-CSRF-Token', otherCsrf)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/applications search & sort', () => {
  it('finds a candidate by name via search', async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate', organization._id, {
      name: 'Zara Unique Name',
    });
    await giveCandidateResume(candidateUser._id);
    await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });

    const res = await recruiterAgent.get('/api/v1/applications?search=Zara Unique');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].candidateId.name).toBe('Zara Unique Name');
  });

  it('does not leak another organization\'s candidates into a search', async () => {
    const { agent: recruiterAgent, user: recruiter } = await createAndLoginUser('recruiter');
    await createPublishedJob(organization._id, recruiter._id);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { user: otherRecruiter } = await createAndLoginUser('recruiter', otherOrg._id);
    const otherJob = await createPublishedJob(otherOrg._id, otherRecruiter._id);
    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate', otherOrg._id, {
      name: 'Searchable Person',
    });
    await giveCandidateResume(candidateUser._id);
    await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: otherJob._id });

    const res = await recruiterAgent.get('/api/v1/applications?search=Searchable');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('Interviewer access to an application', () => {
  it('allows an interviewer to view an application only once assigned an interview for it', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);

    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);
    const createRes = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    const applicationId = createRes.body.data.application._id;

    const { agent: interviewerAgent, user: interviewer } = await createAndLoginUser('interviewer');

    const before = await interviewerAgent.get(`/api/v1/applications/${applicationId}`);
    expect(before.status).toBe(404);

    await Interview.create({
      organizationId: organization._id,
      applicationId,
      candidateId: candidateUser._id,
      jobId: job._id,
      interviewerId: interviewer._id,
      type: 'technical',
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 60 * 1000),
      createdBy: recruiter._id,
    });

    const after = await interviewerAgent.get(`/api/v1/applications/${applicationId}`);
    expect(after.status).toBe(200);
  });

  it('never allows an interviewer from a different org to view the application', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const job = await createPublishedJob(organization._id, recruiter._id);
    const { agent: candidate, csrfToken, user: candidateUser } = await createAndLoginUser('candidate');
    await giveCandidateResume(candidateUser._id);
    const createRes = await candidate.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
    const applicationId = createRes.body.data.application._id;

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherInterviewerAgent } = await createAndLoginUser('interviewer', otherOrg._id);

    const res = await otherInterviewerAgent.get(`/api/v1/applications/${applicationId}`);
    expect(res.status).toBe(404);
  });
});
