import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'my-custom-header'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// In-memory storage with message limit
const PASSWORD_HASH = '$2a$10$.ZTa4WiQIEPPO5GgnT35DOmeBV5aJGiSu0uqHA1Ty33kNkUUWHa7q';
const MAX_MESSAGES = 200;
let messages = [];
const connectedUsers = new Map(); // Map of socket.id to user info

// Function to add a message with limit enforcement
function addMessage(message) {
  messages.push(message);
  // Keep only the most recent messages
  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(-MAX_MESSAGES);
  }
  return messages;
}

// Routes
app.post('/api/join', async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const isMatch = await bcrypt.compare(password, PASSWORD_HASH);
    if (isMatch) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  connectedUsers.set(socket.id, { id: socket.id });
  
  // Emit updated user count to all clients
  io.emit('user-count-update', { count: connectedUsers.size });
  
  // Send previous messages to the newly connected client
  console.log(`Sending ${messages.length} previous messages to new client`);
  socket.emit('previous-messages', messages);
  
  // Handle request for previous messages
  socket.on('request-previous-messages', () => {
    console.log(`Sending ${messages.length} messages on request`);
    socket.emit('previous-messages', messages);
  });
  
  // Handle user ID setup
  socket.on('set-user-id', (userId) => {
    socket.userId = userId;
  });

  // Handle new message
  socket.on('send-message', (message) => {
    console.log('Received new message:', message);
    // Basic validation
    if (!message || typeof message.text !== 'string' || message.text.trim() === '') {
      console.log('Invalid message format');
      return;
    }
    
    // Sanitize and trim message
    const sanitizedMessage = {
      id: message.id || Date.now().toString(),
      text: message.text.trim().substring(0, 2000), // Limit message length
      timestamp: message.timestamp || new Date().toISOString(),
      senderId: message.senderId || socket.id,
      isCurrentUser: message.isCurrentUser || false,
      replyTo: message.replyTo || null,
      senderName: message.senderName || `User-${(message.senderId || socket.id).slice(-4)}`
    };
    
    // Add to messages array with limit
    addMessage(sanitizedMessage);
    
    console.log('Broadcasting message:', sanitizedMessage);
    // Broadcast to all connected clients
    io.emit('new-message', sanitizedMessage);
    
    console.log(`Message stored. Total messages: ${messages.length}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    connectedUsers.delete(socket.id);
    
    // Emit updated user count to all clients
    io.emit('user-count-update', { count: connectedUsers.size });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Log the hashed password for development (in production, this should be in .env)
  console.log('To generate a new password hash, run:');
  console.log('node -e "console.log(require(\'bcryptjs\').hashSync(\'yourpassword\', 10))"');
});
