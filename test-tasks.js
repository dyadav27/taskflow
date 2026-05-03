const axios = require('axios');

async function run() {
  const api = 'http://localhost:3002'; // task-service
  const authApi = 'http://localhost:3001'; // auth-service
  
  // Register user
  const ts = Date.now();
  const reg = await axios.post(`${authApi}/api/auth/register`, {
    name: 'Test User', email: `test${ts}@example.com`, password: 'password123'
  });
  const token = reg.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // Create task
  const t1 = await axios.post(`${api}/api/tasks`, {
    title: 'Task 1', description: 'Desc 1', status: 'todo'
  }, { headers });
  
  console.log('Task created:', t1.data);

  // Get tasks all
  const g1 = await axios.get(`${api}/api/tasks`, { headers });
  console.log('Get all tasks length:', g1.data.tasks.length);
  console.log('Get all tasks ids:', g1.data.tasks.map(t => t.id));

  // Get tasks status=todo
  const g2 = await axios.get(`${api}/api/tasks?status=todo`, { headers });
  console.log('Get todo tasks length:', g2.data.tasks.length);
  console.log('Get todo tasks ids:', g2.data.tasks.map(t => t.id));
}
run().catch(console.error);
