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
let Evaluation;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: Application } = await import('../models/Application.js'));
  ({ default: CandidateProfile } = await import('../models/CandidateProfile.js'));
  ({ default: Interview } = await import('../models/Interview.js'));
  ({ default: Evaluation } = await import('../models/Evaluation.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await CandidateProfile.deleteMany({});
  await Interview.deleteMany({});
  await Evaluation.deleteMany({});
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

async function setupInterview(orgId) {
  const { user: recruiter } = await createAndLoginUser('recruiter', orgId);
  const job = await Job.create({
    organizationId: orgId,
    createdBy: recruiter._id,
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
  const appRes = await candidateAgent.post('/api/v1/applications').set('X-CSRF-Token', csrfToken).send({ jobId: job._id });
  const applicationId = appRes.body.data.application._id;

  const { agent: interviewerAgent, csrfToken: interviewerCsrf, user: interviewer } = await createAndLoginUser(
    'interviewer',
    orgId
  );

  const interview = await Interview.create({
    organizationId: orgId,
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

  return { recruiter, applicationId, interviewerAgent, interviewerCsrf, interviewer, interview };
}

function evaluationPayload(overrides = {}) {
  return {
    technicalSkills: 8,
    problemSolving: 7,
    communication: 9,
    roleKnowledge: 8,
    codingSkills: 7,
    overallRating: 8,
    recommendation: 'select',
    feedback: 'Strong candidate overall.',
    ...overrides,
  };
}

describe('POST /api/v1/evaluations', () => {
  it('rejects non-interviewer roles', async () => {
    const { interview } = await setupInterview(organization._id);
    const { agent, csrfToken } = await createAndLoginUser('recruiter', organization._id);
    const res = await agent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', csrfToken)
      .send({ interviewId: interview._id, ...evaluationPayload() });
    expect(res.status).toBe(403);
  });

  it('rejects an interviewer who is not assigned to the interview', async () => {
    const { interview } = await setupInterview(organization._id);
    const { agent, csrfToken } = await createAndLoginUser('interviewer', organization._id);
    const res = await agent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', csrfToken)
      .send({ interviewId: interview._id, ...evaluationPayload() });
    expect(res.status).toBe(403);
  });

  it('allows the assigned interviewer to submit an evaluation and auto-completes the interview', async () => {
    const { interviewerAgent, interviewerCsrf, interview } = await setupInterview(organization._id);
    const res = await interviewerAgent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', interviewerCsrf)
      .send({ interviewId: interview._id, ...evaluationPayload() });

    expect(res.status).toBe(201);
    expect(res.body.data.evaluation.recommendation).toBe('select');

    const updatedInterview = await Interview.findById(interview._id);
    expect(updatedInterview.status).toBe('completed');
  });

  it('rejects a duplicate evaluation for the same interview', async () => {
    const { interviewerAgent, interviewerCsrf, interview } = await setupInterview(organization._id);
    await interviewerAgent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', interviewerCsrf)
      .send({ interviewId: interview._id, ...evaluationPayload() });

    const res = await interviewerAgent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', interviewerCsrf)
      .send({ interviewId: interview._id, ...evaluationPayload() });
    expect(res.status).toBe(409);
  });

  it('rejects a rating out of the 1-10 range', async () => {
    const { interviewerAgent, interviewerCsrf, interview } = await setupInterview(organization._id);
    const res = await interviewerAgent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', interviewerCsrf)
      .send({ interviewId: interview._id, ...evaluationPayload({ overallRating: 15 }) });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/evaluations/interview/:interviewId', () => {
  it('is visible to the assigned interviewer and to org recruiters, not other interviewers', async () => {
    const { interviewerAgent, interviewerCsrf, interview, recruiter } = await setupInterview(organization._id);
    await interviewerAgent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', interviewerCsrf)
      .send({ interviewId: interview._id, ...evaluationPayload() });

    const ownRes = await interviewerAgent.get(`/api/v1/evaluations/interview/${interview._id}`);
    expect(ownRes.status).toBe(200);

    const { agent: recruiterAgent } = await createAndLoginUser('recruiter', organization._id);
    const recruiterRes = await recruiterAgent.get(`/api/v1/evaluations/interview/${interview._id}`);
    expect(recruiterRes.status).toBe(200);

    const { agent: otherInterviewerAgent } = await createAndLoginUser('interviewer', organization._id);
    const otherRes = await otherInterviewerAgent.get(`/api/v1/evaluations/interview/${interview._id}`);
    expect(otherRes.status).toBe(404);
  });
});

describe('GET /api/v1/applications/:id/evaluations', () => {
  it('lists evaluations across all of an application\'s interviews for the recruiter', async () => {
    const { interviewerAgent, interviewerCsrf, interview, applicationId } = await setupInterview(organization._id);
    await interviewerAgent
      .post('/api/v1/evaluations')
      .set('X-CSRF-Token', interviewerCsrf)
      .send({ interviewId: interview._id, ...evaluationPayload() });

    const { agent: recruiterAgent } = await createAndLoginUser('recruiter', organization._id);
    const res = await recruiterAgent.get(`/api/v1/applications/${applicationId}/evaluations`);
    expect(res.status).toBe(200);
    expect(res.body.data.evaluations).toHaveLength(1);
    expect(res.body.data.evaluations[0].interview.type).toBe('technical');
  });
});
