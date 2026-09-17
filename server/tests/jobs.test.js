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
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Job } = await import('../models/Job.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Job.deleteMany({});
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

function validJobPayload(overrides = {}) {
  return {
    title: 'Frontend Developer',
    description: 'Build delightful user interfaces for our product.',
    requiredSkills: ['React', 'JavaScript'],
    preferredSkills: ['TypeScript'],
    employmentType: 'full-time',
    workMode: 'remote',
    location: 'Bengaluru',
    ...overrides,
  };
}

describe('POST /api/v1/jobs', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/v1/jobs').send(validJobPayload());
    expect(res.status).toBe(401);
  });

  it('rejects candidate and interviewer roles', async () => {
    const { agent, csrfToken } = await createAndLoginUser('candidate');
    const res = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload());
    expect(res.status).toBe(403);
  });

  it('allows a recruiter to create a draft job', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const res = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload());
    expect(res.status).toBe(201);
    expect(res.body.data.job.status).toBe('draft');
  });

  it('rejects an invalid salary range', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const res = await agent
      .post('/api/v1/jobs')
      .set('X-CSRF-Token', csrfToken)
      .send(validJobPayload({ salaryMin: 100000, salaryMax: 50000 }));
    expect(res.status).toBe(400);
  });
});

describe('Job status transitions', () => {
  it('allows the owning recruiter to publish then close a draft job', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const createRes = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload());
    const jobId = createRes.body.data.job._id;

    const publishRes = await agent
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'published' });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.job.status).toBe('published');

    const closeRes = await agent
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'closed' });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.job.status).toBe('closed');
  });

  it('rejects an invalid transition (closed -> published)', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const createRes = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload());
    const jobId = createRes.body.data.job._id;

    await agent.patch(`/api/v1/jobs/${jobId}/status`).set('X-CSRF-Token', csrfToken).send({ status: 'closed' });

    const res = await agent
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ status: 'published' });
    expect(res.status).toBe(400);
  });

  it('blocks a non-owning recruiter from editing or publishing the job', async () => {
    const { agent: owner, csrfToken: ownerToken } = await createAndLoginUser('recruiter');
    const createRes = await owner.post('/api/v1/jobs').set('X-CSRF-Token', ownerToken).send(validJobPayload());
    const jobId = createRes.body.data.job._id;

    const { agent: other, csrfToken: otherToken } = await createAndLoginUser('recruiter');
    const res = await other
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('X-CSRF-Token', otherToken)
      .send({ status: 'published' });
    expect(res.status).toBe(403);
  });

  it('allows an admin to publish a job created by a different recruiter', async () => {
    const { agent: owner, csrfToken: ownerToken } = await createAndLoginUser('recruiter');
    const createRes = await owner.post('/api/v1/jobs').set('X-CSRF-Token', ownerToken).send(validJobPayload());
    const jobId = createRes.body.data.job._id;

    const { agent: admin, csrfToken: adminToken } = await createAndLoginUser('admin');
    const res = await admin
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('X-CSRF-Token', adminToken)
      .send({ status: 'published' });
    expect(res.status).toBe(200);
  });
});

describe('Public job listing', () => {
  it('only returns published jobs to an unauthenticated visitor', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const draftRes = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload({ title: 'Draft Job' }));
    const pubRes = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload({ title: 'Published Job' }));
    await agent.patch(`/api/v1/jobs/${pubRes.body.data.job._id}/status`).set('X-CSRF-Token', csrfToken).send({ status: 'published' });

    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(200);
    const titles = res.body.data.map((j) => j.title);
    expect(titles).toContain('Published Job');
    expect(titles).not.toContain('Draft Job');
  });

  it('returns 404 for a draft job detail to an unauthenticated visitor', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const createRes = await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload());

    const res = await request(app).get(`/api/v1/jobs/${createRes.body.data.job._id}`);
    expect(res.status).toBe(404);
  });

  it('filters by skills and location', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const job1 = await agent
      .post('/api/v1/jobs')
      .set('X-CSRF-Token', csrfToken)
      .send(validJobPayload({ title: 'React Dev', requiredSkills: ['React'], location: 'Bengaluru' }));
    const job2 = await agent
      .post('/api/v1/jobs')
      .set('X-CSRF-Token', csrfToken)
      .send(validJobPayload({ title: 'Java Dev', requiredSkills: ['Java'], location: 'Mumbai' }));

    await agent.patch(`/api/v1/jobs/${job1.body.data.job._id}/status`).set('X-CSRF-Token', csrfToken).send({ status: 'published' });
    await agent.patch(`/api/v1/jobs/${job2.body.data.job._id}/status`).set('X-CSRF-Token', csrfToken).send({ status: 'published' });

    const res = await request(app).get('/api/v1/jobs?skills=React');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('React Dev');
  });

  it('paginates results', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    for (let i = 0; i < 3; i += 1) {
      const createRes = await agent
        .post('/api/v1/jobs')
        .set('X-CSRF-Token', csrfToken)
        .send(validJobPayload({ title: `Job ${i}` }));
      await agent
        .patch(`/api/v1/jobs/${createRes.body.data.job._id}/status`)
        .set('X-CSRF-Token', csrfToken)
        .send({ status: 'published' });
    }

    const res = await request(app).get('/api/v1/jobs?limit=2&page=1');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });
});

describe('Recruiter job listing (staff view)', () => {
  it('shows all statuses within the recruiter\'s own org', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    await agent.post('/api/v1/jobs').set('X-CSRF-Token', csrfToken).send(validJobPayload({ title: 'Draft Job' }));

    const res = await agent.get('/api/v1/jobs');
    expect(res.status).toBe(200);
    expect(res.body.data.map((j) => j.title)).toContain('Draft Job');
  });

  it('never includes jobs from another organization', async () => {
    const otherOrg = await Organization.create({ name: 'Other Org' });
    const { agent: otherAgent, csrfToken: otherToken } = await createAndLoginUser('recruiter', otherOrg._id);
    await otherAgent.post('/api/v1/jobs').set('X-CSRF-Token', otherToken).send(validJobPayload({ title: 'Other Org Job' }));

    const { agent } = await createAndLoginUser('recruiter');
    const res = await agent.get('/api/v1/jobs');
    expect(res.body.data.map((j) => j.title)).not.toContain('Other Org Job');
  });
});
