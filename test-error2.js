async function run() {
  const api = 'http://localhost:3002'; // task-service
  const authApi = 'http://localhost:3001'; // auth-service
  
  // Register user
  const ts = Date.now();
  const regRes = await fetch(`${authApi}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `darshan.yadav23@example.com`, password: 'password123' })
  }); // Note: The screenshot shows darshan.yadav23@...
  
  // Actually, I don't know his password, I'll just use a test user
  const r2 = await fetch(`${authApi}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `test${ts}@example.com`, password: 'password123' })
  });
  const reg = await r2.json();
  const token = reg.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Create a task just in case
  await fetch(`${api}/api/tasks`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Task 1', description: 'Desc 1', status: 'todo' })
  });

  const g1Res = await fetch(`${api}/api/tasks?sort=created_at&order=DESC`, { headers });
  if (!g1Res.ok) {
    const error = await g1Res.text();
    console.log('Error GET /api/tasks?sort=... :', error);
  } else {
    const g1 = await g1Res.json();
    console.log('Success GET /api/tasks:', g1.tasks.length);
  }
}
run().catch(console.error);
