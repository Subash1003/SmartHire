import request from 'supertest';
import bcrypt from 'bcryptjs';
import { setupTestApp } from './setupTestApp.js';
import { extractCsrfToken } from './testUtils.js';

let app;
let mongod;
let mongoose;
let Organization;
let User;

beforeAll(async () => {
  ({ app, mongod, mongoose } = await setupTestApp());
  ({ default: Organization } = await import('../models/Organization.js'));
  ({ default: User } = await import('../models/User.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createAndLoginAdmin(orgId, email) {
  const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
  await User.create({ organizationId: orgId, name: 'Admin', email, passwordHash, role: 'admin' });

  const agent = request.agent(app);
  const loginRes = await agent.post('/api/v1/auth/login').send({ email, password: 'Str0ngPass1' });
  return { agent, csrfToken: extractCsrfToken(loginRes) };
}

describe('Tenant isolation', () => {
  it('blocks an admin from org A from reading a user in org B', async () => {
    const orgA = await Organization.create({ name: 'Org A' });
    const orgB = await Organization.create({ name: 'Org B' });

    const { agent: adminA } = await createAndLoginAdmin(orgA._id, 'adminA@example.com');

    const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
    const userB = await User.create({
      organizationId: orgB._id,
      name: 'User B',
      email: 'userB@example.com',
      passwordHash,
      role: 'recruiter',
    });

    const res = await adminA.get(`/api/v1/users/${userB._id}`);
    expect(res.status).toBe(404);
  });

  it('blocks an admin from org A from updating a user in org B', async () => {
    const orgA = await Organization.create({ name: 'Org A' });
    const orgB = await Organization.create({ name: 'Org B' });

    const { agent: adminA, csrfToken } = await createAndLoginAdmin(orgA._id, 'adminA2@example.com');

    const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
    const userB = await User.create({
      organizationId: orgB._id,
      name: 'User B',
      email: 'userB2@example.com',
      passwordHash,
      role: 'recruiter',
    });

    const res = await adminA
      .put(`/api/v1/users/${userB._id}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(404);

    const unchanged = await User.findById(userB._id);
    expect(unchanged.name).toBe('User B');
  });

  it("only ever lists an org's own users, never another org's", async () => {
    const orgA = await Organization.create({ name: 'Org A' });
    const orgB = await Organization.create({ name: 'Org B' });

    const { agent: adminA } = await createAndLoginAdmin(orgA._id, 'adminA3@example.com');

    const passwordHash = await bcrypt.hash('Str0ngPass1', 4);
    await User.create({
      organizationId: orgB._id,
      name: 'Org B User',
      email: 'orgbuser@example.com',
      passwordHash,
      role: 'recruiter',
    });

    const res = await adminA.get('/api/v1/users');
    expect(res.status).toBe(200);
    expect(res.body.data.every((u) => u.organizationId === orgA._id.toString())).toBe(true);
  });

  it('scopes organization settings to the caller\'s own org', async () => {
    const orgA = await Organization.create({ name: 'Org A' });
    await Organization.create({ name: 'Org B' });

    const { agent: adminA } = await createAndLoginAdmin(orgA._id, 'adminA4@example.com');

    const res = await adminA.get('/api/v1/organizations/me');
    expect(res.status).toBe(200);
    expect(res.body.data.organization.name).toBe('Org A');
  });
});
