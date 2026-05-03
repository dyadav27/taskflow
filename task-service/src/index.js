require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/tasks');
const { connectDB } = require('./db');

const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible in routes if needed, or we can export it.
// Actually, setting it on the app is easiest:
app.set('io', io);

const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint for Kubernetes liveness/readiness probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'task-service', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', taskRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[Task Service Error] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Task Service] Running on port ${PORT} with WebSockets enabled`);
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    // Clients can join a room based on their user ID to receive private updates
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`[WebSocket] Client ${socket.id} joined room: user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });
};

// Only start the server when this file is run directly (not when required by tests)
if (require.main === module) {
  start();
}

module.exports = app;
