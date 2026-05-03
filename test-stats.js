async function run() {
  const api = 'http://localhost:3002'; // task-service
  const authApi = 'http://localhost:3001'; // auth-service
  
  const ts = Date.now();
  const r2 = await fetch(`${authApi}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `test${ts}@example.com`, password: 'password123' })
  });
  const reg = await r2.json();
  const token = reg.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const res = await fetch(`${api}/api/tasks/stats`, { headers });
  if (!res.ok) {
    const error = await res.text();
    console.log('Error GET /api/tasks/stats:', error);
  } else {
    const data = await res.json();
    console.log('Success GET /api/tasks/stats:', data);
  }
}
run().catch(console.error);
