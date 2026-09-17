import { verifyCsrf } from '../middleware/csrfMiddleware.js';

function mockReq({ method = 'POST', cookies = {}, headers = {} } = {}) {
  return {
    method,
    cookies,
    get: (name) => headers[name.toLowerCase()] || headers[name],
  };
}

function createSpy() {
  const calls = [];
  const spy = (...args) => calls.push(args);
  spy.calls = calls;
  return spy;
}

describe('verifyCsrf', () => {
  it('allows safe methods through without a token', () => {
    const next = createSpy();
    verifyCsrf(mockReq({ method: 'GET' }), {}, next);
    expect(next.calls).toHaveLength(1);
    expect(next.calls[0][0]).toBeUndefined();
  });

  it('rejects a mutating request with no CSRF token at all', () => {
    const next = createSpy();
    verifyCsrf(mockReq({ method: 'POST' }), {}, next);
    expect(next.calls[0][0].statusCode).toBe(403);
  });

  it('rejects a mutating request when cookie and header do not match', () => {
    const next = createSpy();
    const req = mockReq({
      cookies: { csrfToken: 'abc' },
      headers: { 'X-CSRF-Token': 'def' },
    });
    verifyCsrf(req, {}, next);
    expect(next.calls[0][0].statusCode).toBe(403);
  });

  it('allows a mutating request when cookie and header match', () => {
    const next = createSpy();
    const req = mockReq({
      cookies: { csrfToken: 'abc' },
      headers: { 'X-CSRF-Token': 'abc' },
    });
    verifyCsrf(req, {}, next);
    expect(next.calls).toHaveLength(1);
    expect(next.calls[0][0]).toBeUndefined();
  });
});
