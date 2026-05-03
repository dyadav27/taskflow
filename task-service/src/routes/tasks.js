const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/tasks — get all tasks for logged-in user with filters
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, priority, category, sort = 'created_at', order = 'DESC' } = req.query;

    const allowedSort = ['created_at', 'due_date', 'priority', 'title', 'updated_at', 'category'];
    const allowedOrder = ['ASC', 'DESC'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
    let sortOrder = 'DESC';

    // map human-readable → SQL
    if (order === 'Oldest First') {
      sortOrder = 'ASC';
    } else if (order === 'Newest First') {
      sortOrder = 'DESC';
    } else if (allowedOrder.includes(order?.toUpperCase())) {
      sortOrder = order.toUpperCase();
    }

    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIdx = 2;

    // ✅ FIX: ignore "all"
    if (status && status !== 'all') {
      query += ` AND status = $${paramIdx++}`;
      params.push(status);
    }

    if (priority && priority !== 'all') {
      query += ` AND priority = $${paramIdx++}`;
      params.push(priority);
    }

    if (category && category !== 'all') {
      query += ` AND category = $${paramIdx++}`;
      params.push(category);
    }

    const tasksQuery = `
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(s ORDER BY s.id ASC) FROM subtasks s WHERE s.task_id = t.id),
          '[]'::json
        ) AS subtasks
      FROM (${query}) t
      ORDER BY t.${sortCol} ${sortOrder}
    `;

    const tasksResult = await pool.query(tasksQuery, params);

    res.status(200).json({ tasks: tasksResult.rows, count: tasksResult.rows.length });
  } catch (err) {
    console.error('[Get Tasks Error]', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/stats — dashboard stats for the user
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'todo') AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done') AS done,
        COUNT(*) AS total
       FROM tasks WHERE user_id = $1`,
      [userId]
    );
    res.status(200).json({ stats: result.rows[0] });
  } catch (err) {
    console.error('[Stats Error]', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/tasks/:id — get single task
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT t.*, 
        COALESCE(
          (SELECT json_agg(s ORDER BY s.id ASC) FROM subtasks s WHERE s.task_id = t.id),
          '[]'::json
        ) AS subtasks
       FROM tasks t WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Task not found' });

    res.status(200).json({ task: result.rows[0] });
  } catch (err) {
    console.error('[Get Task Error]', err.message);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks — create new task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, due_date, category } = req.body;
    const userId = req.user.userId;

    if (!title || title.trim().length === 0)
      return res.status(400).json({ error: 'Task title is required' });

    if (title.length > 200)
      return res.status(400).json({ error: 'Title must be under 200 characters' });

    const validStatuses = ['todo', 'in_progress', 'done'];
    const validPriorities = ['low', 'medium', 'high'];

    if (status && !validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status value' });

    if (priority && !validPriorities.includes(priority))
      return res.status(400).json({ error: 'Invalid priority value' });

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        title.trim(),
        description || '',
        status || 'todo',
        priority || 'medium',
        due_date || null,
        category || 'General'
      ]
    );

    const taskData = result.rows[0];

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('task_updated', { action: 'created', task: taskData });
    }

    res.status(201).json({ message: 'Task created', task: taskData });
  } catch (err) {
    console.error('[Create Task Error]', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, status, priority, due_date, category } = req.body;

    const existing = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0)
      return res.status(404).json({ error: 'Task not found' });

    const task = existing.rows[0];

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, category = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        title?.trim() || task.title,
        description !== undefined ? description : task.description,
        status || task.status,
        priority || task.priority,
        due_date !== undefined ? due_date : task.due_date,
        category !== undefined ? category : task.category,
        id,
        userId
      ]
    );

    const updatedTask = result.rows[0];

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('task_updated', { action: 'updated', task: updatedTask });
    }

    res.status(200).json({ message: 'Task updated', task: updatedTask });
  } catch (err) {
    console.error('[Update Task Error]', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Task not found' });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('task_updated', { action: 'deleted', taskId: id });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('[Delete Task Error]', err.message);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;