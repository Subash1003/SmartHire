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

describe('GET /api/v1/organizations/me', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/organizations/me');
    expect(res.status).toBe(401);
  });

  it('returns the org for any authenticated role', async () => {
    const { agent } = await createAndLoginUser('recruiter');
    const res = await agent.get('/api/v1/organizations/me');
    expect(res.status).toBe(200);
    expect(res.body.data.organization.name).toBe('Acme Corp');
  });
});

describe('PUT /api/v1/organizations/me', () => {
  it('rejects non-admin roles', async () => {
    const { agent, csrfToken } = await createAndLoginUser('recruiter');
    const res = await agent
      .put('/api/v1/organizations/me')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'New Name' });
    expect(res.status).toBe(403);
  });

  it('allows an admin to update org settings', async () => {
    const { agent, csrfToken } = await createAndLoginUser('admin');
    const res = await agent
      .put('/api/v1/organizations/me')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Renamed Corp', industry: 'Fintech' });

    expect(res.status).toBe(200);
    expect(res.body.data.organization.name).toBe('Renamed Corp');
    expect(res.body.data.organization.industry).toBe('Fintech');
  });

  it('rejects the update without a CSRF header', async () => {
    const { agent } = await createAndLoginUser('admin');
    const res = await agent.put('/api/v1/organizations/me').send({ name: 'No CSRF' });
    expect(res.status).toBe(403);
  });
});
