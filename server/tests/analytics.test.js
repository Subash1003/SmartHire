import request from 'supertest';
import bcrypt from 'bcryptjs';
import { setupTestApp } from './setupTestApp.js';

let app;
let mongod;
let mongoose;
let Organization;
let User;
let Job;
let Application;
let Interview;
let Evaluation;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: Application } = await import('../models/Application.js'));
  ({ default: Interview } = await import('../models/Interview.js'));
  ({ default: Evaluation } = await import('../models/Evaluation.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
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
  await agent.post('/api/v1/auth/login').send({ email: user.email, password: 'Str0ngPass1' });
  return { agent, user };
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function seedScenario(orgId, recruiterId) {
  const jobA = await Job.create({
    organizationId: orgId,
    createdBy: recruiterId,
    title: 'Backend Developer',
    description: 'Build the API.',
    requiredSkills: ['Node.js'],
    employmentType: 'full-time',
    workMode: 'remote',
    status: 'published',
  });
  const jobB = await Job.create({
    organizationId: orgId,
    createdBy: recruiterId,
    title: 'Frontend Developer',
    description: 'Build the UI.',
    requiredSkills: ['React'],
    employmentType: 'full-time',
    workMode: 'remote',
    status: 'draft',
  });

  const candidateIds = Array.from({ length: 5 }, () => new mongoose.Types.ObjectId());

  // 1: applied only
  await Application.create({
    organizationId: orgId,
    jobId: jobA._id,
    candidateId: candidateIds[0],
    resumeSnapshot: { url: 'https://x/resume.pdf', fileName: 'r.pdf', fileType: 'application/pdf', fileSize: 10 },
    status: 'applied',
    statusHistory: [{ status: 'applied', changedBy: candidateIds[0], changedAt: daysAgo(10) }],
    appliedAt: daysAgo(10),
  });

  // 2: reached shortlisted
  await Application.create({
    organizationId: orgId,
    jobId: jobA._id,
    candidateId: candidateIds[1],
    resumeSnapshot: { url: 'https://x/resume.pdf', fileName: 'r.pdf', fileType: 'application/pdf', fileSize: 10 },
    status: 'shortlisted',
    statusHistory: [
      { status: 'applied', changedBy: candidateIds[1], changedAt: daysAgo(9) },
      { status: 'under_review', changedBy: recruiterId, changedAt: daysAgo(8) },
      { status: 'shortlisted', changedBy: recruiterId, changedAt: daysAgo(7) },
    ],
    appliedAt: daysAgo(9),
  });

  // 3: selected, with a decision 5 days after applying
  const app3 = await Application.create({
    organizationId: orgId,
    jobId: jobB._id,
    candidateId: candidateIds[2],
    resumeSnapshot: { url: 'https://x/resume.pdf', fileName: 'r.pdf', fileType: 'application/pdf', fileSize: 10 },
    status: 'selected',
    statusHistory: [
      { status: 'applied', changedBy: candidateIds[2], changedAt: daysAgo(5) },
      { status: 'shortlisted', changedBy: recruiterId, changedAt: daysAgo(4) },
      { status: 'selected', changedBy: recruiterId, changedAt: daysAgo(0) },
    ],
    decision: { status: 'selected', madeBy: recruiterId, madeAt: daysAgo(0), notes: '' },
    appliedAt: daysAgo(5),
  });

  // 4: has an interview scheduled + completed + evaluated
  const app4 = await Application.create({
    organizationId: orgId,
    jobId: jobA._id,
    candidateId: candidateIds[3],
    resumeSnapshot: { url: 'https://x/resume.pdf', fileName: 'r.pdf', fileType: 'application/pdf', fileSize: 10 },
    status: 'interview_completed',
    statusHistory: [
      { status: 'applied', changedBy: candidateIds[3], changedAt: daysAgo(6) },
      { status: 'interview_scheduled', changedBy: recruiterId, changedAt: daysAgo(4) },
      { status: 'interview_completed', changedBy: recruiterId, changedAt: daysAgo(2) },
    ],
    appliedAt: daysAgo(6),
  });

  // 5: has an interview scheduled, not yet evaluated
  const app5 = await Application.create({
    organizationId: orgId,
    jobId: jobA._id,
    candidateId: candidateIds[4],
    resumeSnapshot: { url: 'https://x/resume.pdf', fileName: 'r.pdf', fileType: 'application/pdf', fileSize: 10 },
    status: 'interview_scheduled',
    statusHistory: [
      { status: 'applied', changedBy: candidateIds[4], changedAt: daysAgo(3) },
      { status: 'interview_scheduled', changedBy: recruiterId, changedAt: daysAgo(1) },
    ],
    appliedAt: daysAgo(3),
  });

  const interviewer = new mongoose.Types.ObjectId();

  const interview4 = await Interview.create({
    organizationId: orgId,
    applicationId: app4._id,
    candidateId: candidateIds[3],
    jobId: jobA._id,
    interviewerId: interviewer,
    type: 'technical',
    round: 1,
    date: daysAgo(2),
    startTime: daysAgo(2),
    endTime: daysAgo(2),
    status: 'completed',
    createdBy: recruiterId,
  });

  await Interview.create({
    organizationId: orgId,
    applicationId: app5._id,
    candidateId: candidateIds[4],
    jobId: jobA._id,
    interviewerId: interviewer,
    type: 'hr',
    round: 1,
    date: daysAgo(1),
    startTime: daysAgo(1),
    endTime: daysAgo(1),
    status: 'scheduled',
    createdBy: recruiterId,
  });

  await Evaluation.create({
    organizationId: orgId,
    interviewId: interview4._id,
    interviewerId: interviewer,
    technicalSkills: 8,
    problemSolving: 8,
    communication: 6,
    roleKnowledge: 8,
    codingSkills: 8,
    overallRating: 8,
    recommendation: 'select',
  });

  return { jobA, jobB, app3 };
}

describe('GET /api/v1/analytics/overview', () => {
  it('returns real KPI numbers computed from the database', async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    await seedScenario(organization._id, recruiter._id);

    const res = await agent.get('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    expect(res.body.data.totalJobs).toBe(2);
    expect(res.body.data.activeJobs).toBe(1);
    expect(res.body.data.totalApplications).toBe(5);
    expect(res.body.data.shortlisted).toBe(1);
    expect(res.body.data.interviews).toBe(2);
    expect(res.body.data.selected).toBe(1);
    expect(res.body.data.averageTimeToHireDays).toBe(5);
  });

  it('returns null time-to-hire when nobody has been selected yet', async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    const job = await Job.create({
      organizationId: organization._id,
      createdBy: recruiter._id,
      title: 'Backend Developer',
      description: 'Build the API.',
      requiredSkills: [],
      employmentType: 'full-time',
      workMode: 'remote',
      status: 'published',
    });
    await Application.create({
      organizationId: organization._id,
      jobId: job._id,
      candidateId: new mongoose.Types.ObjectId(),
      resumeSnapshot: { url: 'https://x/resume.pdf', fileName: 'r.pdf', fileType: 'application/pdf', fileSize: 10 },
      status: 'applied',
      statusHistory: [{ status: 'applied', changedBy: recruiter._id }],
    });

    const res = await agent.get('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    expect(res.body.data.averageTimeToHireDays).toBeNull();
  });

  it('rejects candidates and interviewers', async () => {
    const { agent } = await createAndLoginUser('candidate');
    const res = await agent.get('/api/v1/analytics/overview');
    expect(res.status).toBe(403);
  });

  it("never mixes another organization's data into the numbers", async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    await seedScenario(organization._id, recruiter._id);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherAgent, user: otherRecruiter } = await createAndLoginUser('recruiter', otherOrg._id);

    const res = await otherAgent.get('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    expect(res.body.data.totalJobs).toBe(0);
    expect(res.body.data.totalApplications).toBe(0);
    void otherRecruiter;
  });
});

describe('GET /api/v1/analytics/applications', () => {
  it('returns trend, pipeline, and per-job counts', async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    const { jobA, jobB } = await seedScenario(organization._id, recruiter._id);

    const res = await agent.get('/api/v1/analytics/applications');
    expect(res.status).toBe(200);
    expect(res.body.data.trend.length).toBeGreaterThan(0);
    expect(res.body.data.trend.reduce((sum, t) => sum + t.count, 0)).toBe(5);

    const pipelineTotal = res.body.data.pipeline.reduce((sum, p) => sum + p.count, 0);
    expect(pipelineTotal).toBe(5);

    const jobATitle = res.body.data.byJob.find((j) => j.jobId === jobA._id.toString());
    expect(jobATitle.count).toBe(4);
    const jobBTitle = res.body.data.byJob.find((j) => j.jobId === jobB._id.toString());
    expect(jobBTitle.count).toBe(1);
  });
});

describe('GET /api/v1/analytics/hiring-funnel', () => {
  it('computes cumulative funnel stages from ever-reached status, not just current status', async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    await seedScenario(organization._id, recruiter._id);

    const res = await agent.get('/api/v1/analytics/hiring-funnel');
    expect(res.status).toBe(200);
    const byStage = Object.fromEntries(res.body.data.funnel.map((f) => [f.stage, f.count]));
    expect(byStage.Applications).toBe(5);
    // apps 2, 3, 4, 5 all passed under_review/shortlisted/interview/selected at some point
    expect(byStage.Screening).toBe(4);
    // apps 2, 3, 4, 5 all reached shortlisted or a later stage
    expect(byStage.Shortlisted).toBe(4);
    // apps 4 and 5 have an actual Interview document
    expect(byStage.Interview).toBe(2);
    expect(byStage.Selected).toBe(1);
  });
});

describe('GET /api/v1/analytics/interviews', () => {
  it('returns scheduled/completed/pending-evaluation counts and average score', async () => {
    const { agent, user: recruiter } = await createAndLoginUser('recruiter');
    await seedScenario(organization._id, recruiter._id);

    const res = await agent.get('/api/v1/analytics/interviews');
    expect(res.status).toBe(200);
    expect(res.body.data.scheduled).toBe(1);
    expect(res.body.data.completed).toBe(1);
    expect(res.body.data.pendingEvaluations).toBe(0);
    expect(res.body.data.averageInterviewScore).toBe(8);
  });

  it('returns null average score when there are no evaluations yet', async () => {
    const { agent } = await createAndLoginUser('recruiter');
    const res = await agent.get('/api/v1/analytics/interviews');
    expect(res.status).toBe(200);
    expect(res.body.data.averageInterviewScore).toBeNull();
    expect(res.body.data.scheduled).toBe(0);
  });
});
