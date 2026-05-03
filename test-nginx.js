async function run() {
  const api = 'http://localhost:3000'; // Nginx port!
  
  // Register user
  const ts = Date.now();
  const regRes = await fetch(`${api}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `test${ts}@example.com`, password: 'password123' })
  });
  const reg = await regRes.json();
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
