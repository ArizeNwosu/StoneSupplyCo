require('dotenv').config({ path: '.env.test' });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, clearTable } = require('./helpers/db');
const authRouter = require('../auth/routes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

beforeAll(() => setupTestDb());
afterAll(() => teardownTestDb());
beforeEach(() => clearTable('accounts'));

describe('POST /api/auth/signup', () => {
  test('creates account and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'new@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.account.email).toBe('new@example.com');
    expect(res.body.account.plan).toBe('free');
  });

  test('normalises email to lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'UPPER@EXAMPLE.COM', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.account.email).toBe('upper@example.com');
  });

  test('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'x@y.com' });
    expect(res.status).toBe(400);
  });

  test('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'x@y.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  test('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/signup').send({ email: 'dup@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/signup').send({ email: 'dup@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('blocks signup when INVITE_CODE is set and code is wrong', async () => {
    process.env.INVITE_CODE = 'secret123';
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'x@y.com', password: 'password123', invite_code: 'wrong' });
    expect(res.status).toBe(403);
    delete process.env.INVITE_CODE;
  });

  test('allows signup when correct INVITE_CODE is provided', async () => {
    process.env.INVITE_CODE = 'secret123';
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'invited@example.com', password: 'password123', invite_code: 'secret123' });
    expect(res.status).toBe(200);
    delete process.env.INVITE_CODE;
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login@example.com', password: 'correctpassword' });
  });

  test('returns a JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correctpassword' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('is case-insensitive for email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'LOGIN@EXAMPLE.COM', password: 'correctpassword' });
    expect(res.status).toBe(200);
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'correctpassword' });
    expect(res.status).toBe(401);
  });

  test('does not expose which field was wrong (same error message for both)', async () => {
    const wrongPass = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'bad' });
    const wrongEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'correctpassword' });
    expect(wrongPass.body.error).toBe(wrongEmail.body.error);
  });
});
