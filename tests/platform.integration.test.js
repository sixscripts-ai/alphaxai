const request = require('supertest');
const app = require('../index');
const connectDB = require('../src/utils/database');
const { getDB } = require('../src/utils/database');

const resetTables = async () => {
  const db = getDB();
  await db.execute('DELETE FROM conversations');
  await db.execute('DELETE FROM users');
  await db.execute('DELETE FROM organizations');
  await db.execute('DELETE FROM platform_leads');
};

describe('Platform and Turso-backed core flows', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await resetTables();
  });

  test('submits and lists platform leads', async () => {
    await request(app)
      .post('/api/platform/leads')
      .send({ name: 'Lead User', email: 'lead@example.com', company: 'Acme', message: 'Hello' })
      .expect(201);

    await request(app)
      .get('/api/platform/leads')
      .expect(401);

    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Lead Admin',
        email: 'lead-admin@example.com',
        password: 'Password123!',
        companyName: 'Lead Ops'
      })
      .expect(201);

    const token = register.body.token;

    const response = await request(app)
      .get('/api/platform/leads')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].email).toBe('lead@example.com');
  });

  test('validates lead payload and rejects duplicate lead email', async () => {
    await request(app)
      .post('/api/platform/leads')
      .send({ name: 'A', email: 'not-an-email' })
      .expect(400);

    await request(app)
      .post('/api/platform/leads')
      .send({ name: 'Lead User', email: 'dupe@example.com', company: 'Acme', message: 'hello' })
      .expect(201);

    const duplicate = await request(app)
      .post('/api/platform/leads')
      .send({ name: 'Lead User 2', email: 'dupe@example.com', company: 'Acme 2', message: 'hello again' })
      .expect(409);

    expect(duplicate.body.success).toBe(false);
    expect(duplicate.body.error).toContain('Lead already exists');
  });

  test('register/login and conversation lifecycle works on Turso', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
        companyName: 'Alice Co'
      })
      .expect(201);

    expect(register.body.data.organization.plan).toBe('starter');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' })
      .expect(200);

    const token = login.body.token;

    const createConversation = await request(app)
      .post('/api/ai/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Turso conversation' })
      .expect(201);

    const conversationId = createConversation.body.data.id;

    const getConversation = await request(app)
      .get(`/api/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getConversation.body.data.title).toBe('Turso conversation');

    await request(app)
      .delete(`/api/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
