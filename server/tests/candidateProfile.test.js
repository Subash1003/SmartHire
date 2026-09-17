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

async function createAndLoginUser(role) {
  const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
  await User.create({
    organizationId: organization._id,
    name: `Test ${role}`,
    email: `${role}@example.com`,
    passwordHash,
    role,
  });

  const agent = request.agent(app);
  const loginRes = await agent.post('/api/v1/auth/login').send({ email: `${role}@example.com`, password: 'Str0ngPass1' });
  return { agent, csrfToken: extractCsrfToken(loginRes) };
}

describe('GET /api/v1/candidates/profile', () => {
  it('rejects non-candidate roles', async () => {
    const { agent } = await createAndLoginUser('recruiter');
    const res = await agent.get('/api/v1/candidates/profile');
    expect(res.status).toBe(403);
  });

  it('creates and returns an empty profile on first access', async () => {
    const { agent } = await createAndLoginUser('candidate');
    const res = await agent.get('/api/v1/candidates/profile');
    expect(res.status).toBe(200);
    expect(res.body.data.profile.skills).toEqual([]);
  });
});

describe('PUT /api/v1/candidates/profile', () => {
  it('upserts profile fields', async () => {
    const { agent, csrfToken } = await createAndLoginUser('candidate');

    const res = await agent
      .put('/api/v1/candidates/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ summary: 'Full-stack developer', skills: ['React', 'Node.js'], location: 'Bengaluru' });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.skills).toEqual(['React', 'Node.js']);

    const getRes = await agent.get('/api/v1/candidates/profile');
    expect(getRes.body.data.profile.summary).toBe('Full-stack developer');
  });

  it('rejects an invalid link field', async () => {
    const { agent, csrfToken } = await createAndLoginUser('candidate');
    const res = await agent
      .put('/api/v1/candidates/profile')
      .set('X-CSRF-Token', csrfToken)
      .send({ github: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});
