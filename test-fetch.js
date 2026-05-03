async function run() {
  const api = 'http://localhost:3002'; // task-service
  const authApi = 'http://localhost:3001'; // auth-service
  
  // Register user
  const ts = Date.now();
  const regRes = await fetch(`${authApi}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `test${ts}@example.com`, password: 'password123' })
  });
  const reg = await regRes.json();
  const token = reg.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Create task
  const t1Res = await fetch(`${api}/api/tasks`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Task 1', description: 'Desc 1', status: 'todo' })
  });
  const t1 = await t1Res.json();
  console.log('Task created:', t1);

  // Get tasks all
  const g1Res = await fetch(`${api}/api/tasks`, { headers });
  const g1 = await g1Res.json();
  console.log('Get all tasks length:', g1.tasks.length);
  console.log('Get all tasks ids:', g1.tasks.map(t => t.id));

  // Get tasks status=todo
  const g2Res = await fetch(`${api}/api/tasks?status=todo`, { headers });
  const g2 = await g2Res.json();
  console.log('Get todo tasks length:', g2.tasks.length);
  console.log('Get todo tasks ids:', g2.tasks.map(t => t.id));
}
run().catch(console.error);
