const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost', port: 5432, user: 'taskflow_user', password: 'taskflow_pass', database: 'taskflow'
  });
  await client.connect();

  const query = "SELECT * FROM tasks WHERE user_id = 2 ORDER BY created_at DESC";
  const tasksQuery = `
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(s ORDER BY s.id ASC) FROM subtasks s WHERE s.task_id = t.id),
          '[]'::json
        ) AS subtasks
      FROM (${query}) t
  `;

  const res = await client.query(tasksQuery);
  console.log('Returned IDs in order:');
  res.rows.forEach(r => console.log(`ID: ${r.id}, Created: ${r.created_at}`));

  await client.end();
}
run().catch(console.error);
