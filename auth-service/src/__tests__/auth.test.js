// jest.mock calls are hoisted by Jest — keep them before all requires
jest.mock('../db', () => ({
  pool: {
    query: jest.fn()
  },
  connectDB: jest.fn().mockResolvedValue(true)
}));

const request = require('supertest');
const app = require('../index');
const { pool } = require('../db');

describe('Auth Service - Health Check', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('Auth Service - Register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 409 if email already exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test', email: 'existing@test.com', password: 'password123'
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('Auth Service - Login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 401 for invalid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({
      email: 'noone@test.com', password: 'wrongpass'
    });
    expect(res.statusCode).toBe(401);
  });
});
