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
let Application;
let CandidateProfile;
let AuditLog;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
  ({ default: Application } = await import('../models/Application.js'));
  ({ default: CandidateProfile } = await import('../models/CandidateProfile.js'));
  ({ default: AuditLog } = await import('../models/AuditLog.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await CandidateProfile.deleteMany({});
  await AuditLog.deleteMany({});
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

describe('audit logging on important actions', () => {
  it('logs user_created when an admin creates a user', async () => {
    const { agent, csrfToken } = await createAndLoginUser('admin');

    const res = await agent
      .post('/api/v1/users')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'New Recruiter', email: 'new-recruiter@example.com', password: 'Str0ngPass1', role: 'recruiter' });
    expect(res.status).toBe(201);

    const log = await AuditLog.findOne({ action: 'user_created' });
    expect(log).not.toBeNull();
    expect(log.resourceType).toBe('user');
    expect(log.newValue.role).toBe('recruiter');
  });

  it('logs user_role_changed only when the role actually changes', async () => {
    const { agent, csrfToken } = await createAndLoginUser('admin');
    const { user: interviewer } = await createAndLoginUser('interviewer');

    // Unrelated field change should not log a role change.
    await agent.put(`/api/v1/users/${interviewer._id}`).set('X-CSRF-Token', csrfToken).send({ name: 'Renamed' });
    expect(await AuditLog.countDocuments({ action: 'user_role_changed' })).toBe(0);

    const res = await agent
      .put(`/api/v1/users/${interviewer._id}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ role: 'recruiter' });
    expect(res.status).toBe(200);

    const log = await AuditLog.findOne({ action: 'user_role_changed' });
    expect(log).not.toBeNull();
    expect(log.previousValue.role).toBe('interviewer');
    expect(log.newValue.role).toBe('recruiter');
  });

  it('logs job_created and job_published', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');

    const createRes = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send({
      title: 'Backend Developer',
      description: 'Build the API.',
      requiredSkills: ['Node.js'],
      employmentType: 'full-time',
      workMode: 'remote',
    });
    expect(createRes.status).toBe(201);
    expect(await AuditLog.countDocuments({ action: 'job_created' })).toBe(1);

    const jobId = createRes.body.data.job._id;
    const publishRes = await agent
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'published' });
    expect(publishRes.status).toBe(200);

    const log = await AuditLog.findOne({ action: 'job_published' });
    expect(log).not.toBeNull();
    expect(log.previousValue.status).toBe('draft');
    expect(log.newValue.status).toBe('published');
  });

  it('logs application_submitted and application_status_changed', async () => {
    const { agent: recruiterAgent, csrfToken: recruiterCsrf } = await createAndLoginUser('recruiter');
    const jobRes = await recruiterAgent.post('/api/v1/jobs').set('X-CSRF-Token', recruiterCsrf).send({
      title: 'Backend Developer',
      description: 'Build the API.',
      requiredSkills: ['Node.js'],
      employmentType: 'full-time',
      workMode: 'remote',
    });
    const jobId = jobRes.body.data.job._id;
    await recruiterAgent.patch(`/api/v1/jobs/${jobId}/status`).set('X-CSRF-Token', recruiterCsrf).send({ status: 'published' });

    const { agent: candidateAgent, csrfToken: candidateCsrf, user: candidateUser } = await createAndLoginUser('candidate');
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

    const applyRes = await candidateAgent.post('/api/v1/applications').set('X-CSRF-Token', candidateCsrf).send({ jobId });
    expect(applyRes.status).toBe(201);
    expect(await AuditLog.countDocuments({ action: 'application_submitted' })).toBe(1);

    const applicationId = applyRes.body.data.application._id;
    const statusRes = await recruiterAgent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('X-CSRF-Token', recruiterCsrf)
      .send({ status: 'under_review' });
    expect(statusRes.status).toBe(200);

    const log = await AuditLog.findOne({ action: 'application_status_changed' });
    expect(log.previousValue.status).toBe('applied');
    expect(log.newValue.status).toBe('under_review');

    const decisionRes = await recruiterAgent
      .post(`/api/v1/applications/${applicationId}/decision`)
      .set('X-CSRF-Token', recruiterCsrf)
      .send({ status: 'selected', notes: 'Great fit' });
    expect(decisionRes.status).toBe(200);
    expect(await AuditLog.countDocuments({ action: 'hiring_decision_made' })).toBe(1);
  });
});

describe('GET /api/v1/audit-logs', () => {
  it('rejects non-admin roles', async () => {
    const { agent } = await createAndLoginUser('recruiter');
    const res = await agent.get('/api/v1/audit-logs');
    expect(res.status).toBe(403);
  });

  it('lists logs for the admin\'s organization, filterable and paginated', async () => {
    const { agent: adminAgent, user: admin } = await createAndLoginUser('admin');

    await AuditLog.create([
      { organizationId: organization._id, actorId: admin._id, action: 'job_created', resourceType: 'job', resourceId: new mongoose.Types.ObjectId() },
      { organizationId: organization._id, actorId: admin._id, action: 'job_published', resourceType: 'job', resourceId: new mongoose.Types.ObjectId() },
    ]);

    const otherOrg = await Organization.create({ name: 'Other Org' });
    await AuditLog.create({
      organizationId: otherOrg._id,
      actorId: admin._id,
      action: 'job_created',
      resourceType: 'job',
      resourceId: new mongoose.Types.ObjectId(),
    });

    const allRes = await adminAgent.get('/api/v1/audit-logs');
    expect(allRes.status).toBe(200);
    expect(allRes.body.data).toHaveLength(2);

    const filteredRes = await adminAgent.get('/api/v1/audit-logs?action=job_published');
    expect(filteredRes.body.data).toHaveLength(1);
    expect(filteredRes.body.data[0].action).toBe('job_published');

    const pagedRes = await adminAgent.get('/api/v1/audit-logs?page=1&limit=1');
    expect(pagedRes.body.data).toHaveLength(1);
    expect(pagedRes.body.pagination.totalPages).toBe(2);
  });
});
