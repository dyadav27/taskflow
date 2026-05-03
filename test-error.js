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

  // Get tasks all
  const g1Res = await fetch(`${api}/api/tasks`, { headers });
  if (!g1Res.ok) {
    const error = await g1Res.text();
    console.log('Error GET /api/tasks:', error);
  } else {
    const g1 = await g1Res.json();
    console.log('Success GET /api/tasks:', g1.tasks.length);
  }
}
run().catch(console.error);
