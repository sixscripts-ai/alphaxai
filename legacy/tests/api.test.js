const request = require('supertest');
const app = require('../index');

describe('AlphaX AI API', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.message).toBe('Welcome to AlphaX AI - Advanced AI Platform');
    expect(response.body.status).toBe('running');
    expect(response.body.version).toBe('2.0.0');
  });

  test('GET /api/health should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
    expect(response.body.memory).toBeDefined();
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Not found');
  });

  test('POST /api/auth/register should validate required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({})
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });

  test('GET /api/ai/conversations should require authentication', async () => {
    const response = await request(app)
      .get('/api/ai/conversations')
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Not authorized');
  });
});