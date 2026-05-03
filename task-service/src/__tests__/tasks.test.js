// jest.mock calls are hoisted by Jest — keep them before all requires
jest.mock('../db', () => ({
  pool: { query: jest.fn() },
  connectDB: jest.fn().mockResolvedValue(true)
}));

jest.mock('../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { userId: 1, email: 'test@test.com' };
    next();
  }
}));

const request = require('supertest');
const app = require('../index');
const { pool } = require('../db');

describe('Task Service - Health', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('task-service');
  });
});

describe('Task Service - Create Task', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 if title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer faketoken')
      .send({ description: 'No title here' });
    expect(res.statusCode).toBe(400);
  });

  it('should create a task successfully', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Test Task', status: 'todo', priority: 'medium', user_id: 1 }]
    });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer faketoken')
      .send({ title: 'Test Task' });
    expect(res.statusCode).toBe(201);
    expect(res.body.task.title).toBe('Test Task');
  });
});
