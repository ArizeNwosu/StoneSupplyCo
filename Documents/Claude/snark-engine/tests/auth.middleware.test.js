process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const { authenticate } = require('../auth/middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

test('returns 401 when Authorization header is missing', () => {
  const req = { headers: {} };
  const res = mockRes();
  const next = jest.fn();
  authenticate(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});

test('returns 401 for a malformed token', () => {
  const req = { headers: { authorization: 'Bearer not-a-jwt' } };
  const res = mockRes();
  const next = jest.fn();
  authenticate(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});

test('calls next() and attaches account to req for a valid token', () => {
  const payload = { account_id: 'uuid-abc', email: 'x@y.com', is_admin: false };
  const token = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  const next = jest.fn();
  authenticate(req, res, next);
  expect(next).toHaveBeenCalled();
  expect(req.account.account_id).toBe('uuid-abc');
  expect(req.account.email).toBe('x@y.com');
});

test('returns 401 for an expired token', () => {
  const payload = { account_id: 'uuid-xyz', email: 'y@z.com', is_admin: false };
  const token = jwt.sign(payload, 'test-secret', { expiresIn: '-1s' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  const next = jest.fn();
  authenticate(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});
