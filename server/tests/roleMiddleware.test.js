import { requireRole } from '../middleware/roleMiddleware.js';

function mockRes() {
  return {};
}

function createSpy() {
  const calls = [];
  const spy = (...args) => calls.push(args);
  spy.calls = calls;
  return spy;
}

describe('requireRole', () => {
  it('calls next with no error when the user has an allowed role', () => {
    const req = { user: { role: 'recruiter' } };
    const next = createSpy();

    requireRole('recruiter', 'admin')(req, mockRes(), next);

    expect(next.calls).toHaveLength(1);
    expect(next.calls[0][0]).toBeUndefined();
  });

  it('calls next with a 403 ApiError when the role is not allowed', () => {
    const req = { user: { role: 'candidate' } };
    const next = createSpy();

    requireRole('recruiter', 'admin')(req, mockRes(), next);

    expect(next.calls).toHaveLength(1);
    expect(next.calls[0][0].statusCode).toBe(403);
  });

  it('calls next with a 401 ApiError when there is no authenticated user', () => {
    const req = {};
    const next = createSpy();

    requireRole('recruiter')(req, mockRes(), next);

    expect(next.calls[0][0].statusCode).toBe(401);
  });
});
