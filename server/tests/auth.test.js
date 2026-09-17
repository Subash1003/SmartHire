import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

let mongod;
let app;
let User;
let Organization;
let organization;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(process.env.MONGO_URI);

  ({ default: app } = await import('../app.js'));
  ({ default: User } = await import('../models/User.js'));
  ({ default: Organization } = await import('../models/Organization.js'));
});

beforeEach(async () => {
  await User.deleteMany({});
  organization = await Organization.create({ name: 'Test Org' });
});

afterEach(async () => {
  await Organization.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function registerPayload(overrides = {}) {
  return {
    organizationId: organization._id.toString(),
    name: 'Jamie Candidate',
    email: 'jamie@example.com',
    password: 'Str0ngPass!',
    ...overrides,
  };
}

describe('POST /api/v1/auth/register', () => {
  it('registers a candidate and sets auth cookies', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(registerPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('candidate');
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toMatch(/accessToken=/);
    expect(cookies).toMatch(/refreshToken=/);
    expect(cookies).toMatch(/csrfToken=/);
  });

  it('rejects registration with an invalid organization', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload({ organizationId: new mongoose.Types.ObjectId().toString() }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload());
    const res = await request(app).post('/api/v1/auth/register').send(registerPayload());

    expect(res.status).toBe(409);
  });

  it('rejects a weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(registerPayload({ password: 'weak' }));
    expect(res.status).toBe(400);
  });

  it('ignores a client-supplied role and forces candidate', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload({ role: 'admin' }));

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('candidate');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload());

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'jamie@example.com', password: 'Str0ngPass!' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('jamie@example.com');
  });

  it('rejects an incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload());

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'jamie@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
  });

  it('rejects login for a non-existent user without leaking existence', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Str0ngPass!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it.each(['admin', 'recruiter', 'interviewer', 'candidate'])('logs in a %s user', async (role) => {
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash('Str0ngPass!', 4);
    await User.create({
      organizationId: organization._id,
      name: `Test ${role}`,
      email: `${role}@example.com`,
      passwordHash,
      role,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `${role}@example.com`, password: 'Str0ngPass!' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe(role);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('rejects requests with no access token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a garbage access token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', ['accessToken=not-a-real-token']);
    expect(res.status).toBe(401);
  });

  it('returns the current user for an authenticated session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(registerPayload());

    const res = await agent.get('/api/v1/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('jamie@example.com');
  });
});

describe('POST /api/v1/auth/refresh and logout', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(registerPayload());

    const res = await agent.post('/api/v1/auth/refresh');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/accessToken=/);
  });

  it('rejects refresh with no refresh token cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('requires a matching CSRF header to log out', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(registerPayload());

    const res = await agent.post('/api/v1/auth/logout');
    expect(res.status).toBe(403);
  });

  it('logs out successfully with a valid CSRF header and revokes the session', async () => {
    const agent = request.agent(app);
    const registerRes = await agent.post('/api/v1/auth/register').send(registerPayload());
    const csrfCookie = registerRes.headers['set-cookie']
      .map((c) => c.split(';')[0])
      .find((c) => c.startsWith('csrfToken='));
    const csrfToken = csrfCookie.split('=')[1];

    const logoutRes = await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', csrfToken);
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(401);
  });
});
