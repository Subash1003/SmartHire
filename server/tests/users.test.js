import request from 'supertest';
import bcrypt from 'bcryptjs';
import { setupTestApp } from './setupTestApp.js';
import { extractCsrfToken } from './testUtils.js';

let app;
let mongod;
let mongoose;
let Organization;
let User;
let organization;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  organization = await Organization.create({ name: 'Acme Corp' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createAndLoginUser(role, overrides = {}) {
  const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
  const user = await User.create({
    organizationId: organization._id,
    name: overrides.name || `Test ${role}`,
    email: overrides.email || `${role}@example.com`,
    passwordHash,
    role,
  });

  const agent = request.agent(app);
  const loginRes = await agent
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: 'Str0ngPass1' });
  return { agent, csrfToken: extractCsrfToken(loginRes), user };
}

describe('POST /api/v1/users', () => {
  it('rejects non-admin roles', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const res = await agent
      .post('/api/v1/users')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'New Recruiter', email: 'newrec@example.com', password: 'Str0ngPass1', role: 'recruiter' });
    expect(res.status).toBe(403);
  });

  it('allows an admin to create a recruiter', async () => {
    const { agent, csrfToken } = await createAndLoginUser('admin');
    const res = await agent
      .post('/api/v1/users')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'New Recruiter', email: 'newrec@example.com', password: 'Str0ngPass1', role: 'recruiter' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('recruiter');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email', async () => {
    const { agent, csrfToken, user } = await createAndLoginUser('admin');
    const res = await agent
      .post('/api/v1/users')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Dup', email: user.email, password: 'Str0ngPass1', role: 'recruiter' });
    expect(res.status).toBe(409);
  });

  it('rejects an invalid role', async () => {
    const { agent, csrfToken } = await createAndLoginUser('admin');
    const res = await agent
      .post('/api/v1/users')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Bad Role', email: 'badrole@example.com', password: 'Str0ngPass1', role: 'candidate' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/users', () => {
  it('lists and paginates org users, excluding password hashes', async () => {
    const { agent } = await createAndLoginUser('admin');
    for (let i = 0; i < 3; i += 1) {
      await createAndLoginUser('recruiter', { email: `rec${i}@example.com`, name: `Rec ${i}` });
    }

    const res = await agent.get('/api/v1/users?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.data[0].passwordHash).toBeUndefined();
  });

  it('filters by role', async () => {
    const { agent } = await createAndLoginUser('admin');
    await createAndLoginUser('interviewer');

    const res = await agent.get('/api/v1/users?role=interviewer');
    expect(res.status).toBe(200);
    expect(res.body.data.every((u) => u.role === 'interviewer')).toBe(true);
  });

  it('allows a recruiter to read the list (needed to assign interviewers)', async () => {
    const { agent } = await createAndLoginUser('recruiter');
    const { user: interviewer } = await createAndLoginUser('interviewer');

    const listRes = await agent.get('/api/v1/users?role=interviewer');
    expect(listRes.status).toBe(200);

    const getRes = await agent.get(`/api/v1/users/${interviewer._id}`);
    expect(getRes.status).toBe(200);
  });
});

describe('PATCH /api/v1/users/:id/status', () => {
  it('allows an admin to deactivate another user', async () => {
    const { agent, csrfToken } = await createAndLoginUser('admin');
    const { user: recruiter } = await createAndLoginUser('recruiter');

    const res = await agent
      .patch(`/api/v1/users/${recruiter._id}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isActive).toBe(false);
  });

  it('prevents an admin from deactivating themselves', async () => {
    const { agent, csrfToken, user } = await createAndLoginUser('admin');

    const res = await agent
      .patch(`/api/v1/users/${user._id}/status`)
      .set('X-CSRF-Token', csrfToken)
      .send({ isActive: false });

    expect(res.status).toBe(400);
  });
});
