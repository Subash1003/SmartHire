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
  return { applicationId: res.body.data.application._id, candidateUser, job };
}

function slot(hourStart, hourEnd = hourStart + 1) {
  const date = '2027-01-15';
  return {
    date: `${date}T00:00:00.000Z`,
    startTime: `${date}T${String(hourStart).padStart(2, '0')}:00:00.000Z`,
    endTime: `${date}T${String(hourEnd).padStart(2, '0')}:00:00.000Z`,
  };
}

function schedulePayload(overrides = {}) {
  return {
    type: 'technical',
    round: 1,
    ...slot(10, 11),
    meetingLink: 'https://meet.example.com/room',
    notes: 'First round',
    ...overrides,
  };
}

describe('POST /api/v1/interviews', () => {
  it('rejects the interviewer role from scheduling', async () => {
    const { user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);
    const { agent: interviewerAgent, csrfToken, user: interviewer } = await createAndLoginUser('interviewer');

    const res = await interviewerAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId, interviewerId: interviewer._id, ...schedulePayload() });
    expect(res.status).toBe(403);
  });

  it('allows a recruiter to schedule an interview with a valid interviewer', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');

    const res = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId, interviewerId: interviewer._id, ...schedulePayload() });

    expect(res.status).toBe(201);
    expect(res.body.data.interview.status).toBe('scheduled');
    expect(res.body.data.interview.interviewerId.name).toBe(interviewer.name);
  });

  it('rejects an interviewer who is not an interviewer role or not in the org', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);
    const { user: notAnInterviewer } = await createAndLoginUser('recruiter');

    const res = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId, interviewerId: notAnInterviewer._id, ...schedulePayload() });
    expect(res.status).toBe(400);
  });

  it('rejects an overlapping time slot for the same interviewer', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId: app1 } = await createApplicationFor(organization._id, recruiter._id);
    const { applicationId: app2 } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');

    const first = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app1, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });
    expect(first.status).toBe(201);

    const overlapping = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app2, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });
    expect(overlapping.status).toBe(409);
  });

  it('allows a non-overlapping back-to-back slot for the same interviewer', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId: app1 } = await createApplicationFor(organization._id, recruiter._id);
    const { applicationId: app2 } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');

    await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app1, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });

    const res = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app2, interviewerId: interviewer._id, ...schedulePayload(slot(11, 12)) });
    expect(res.status).toBe(201);
  });
});

describe('PUT /api/v1/interviews/:id (reschedule)', () => {
  it('reschedules successfully and re-checks conflicts excluding itself', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');

    const createRes = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });
    const interviewId = createRes.body.data.interview._id;

    const res = await recruiterAgent
      .put(`/api/v1/interviews/${interviewId}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ interviewerId: interviewer._id, ...schedulePayload(slot(14, 15)) });

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.interview.startTime).getUTCHours()).toBe(14);
  });

  it('blocks a rescheduled slot that conflicts with another of the interviewer\'s interviews', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId: app1 } = await createApplicationFor(organization._id, recruiter._id);
    const { applicationId: app2 } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');

    const first = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app1, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });

    const second = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app2, interviewerId: interviewer._id, ...schedulePayload(slot(14, 15)) });

    const res = await recruiterAgent
      .put(`/api/v1/interviews/${second.body.data.interview._id}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });

    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/v1/interviews/:id/status', () => {
  it('cancels an interview and it no longer blocks that time slot', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId: app1 } = await createApplicationFor(organization._id, recruiter._id);
    const { applicationId: app2 } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');

    const first = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app1, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });

    const cancelRes = await recruiterAgent
      .patch(`/api/v1/interviews/${first.body.data.interview._id}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'cancelled' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.interview.status).toBe('cancelled');

    const second = await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app2, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });
    expect(second.status).toBe(201);
  });
});

describe('GET /api/v1/interviews', () => {
  it('shows an interviewer only their own assigned interviews', async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId: app1 } = await createApplicationFor(organization._id, recruiter._id);
    const { applicationId: app2 } = await createApplicationFor(organization._id, recruiter._id);
    const { agent: interviewerAAgent, user: interviewerA } = await createAndLoginUser('interviewer');
    const { user: interviewerB } = await createAndLoginUser('interviewer');

    await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app1, interviewerId: interviewerA._id, ...schedulePayload(slot(10, 11)) });
    await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId: app2, interviewerId: interviewerB._id, ...schedulePayload(slot(14, 15)) });

    const res = await interviewerAAgent.get('/api/v1/interviews');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].interviewerId._id).toBe(interviewerA._id.toString());
  });

  it("never shows another organization's interviews to a recruiter", async () => {
    const { agent: recruiterAgent, csrfToken, user: recruiter } = await createAndLoginUser('recruiter');
    const { applicationId } = await createApplicationFor(organization._id, recruiter._id);
    const { user: interviewer } = await createAndLoginUser('interviewer');
    await recruiterAgent
      .post('/api/v1/interviews')
      .set('X-CSRF-Token', csrfToken)
      .send({ applicationId, interviewerId: interviewer._id, ...schedulePayload(slot(10, 11)) });

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherRecruiterAgent } = await createAndLoginUser('recruiter', otherOrg._id);
    const res = await otherRecruiterAgent.get('/api/v1/interviews');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
