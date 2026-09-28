require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const attachMeetingSocket = require('./socket/meetingSocket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

connectDB();

const app = express();

// ---------- Global Middleware ----------
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ---------- Routes ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'whizz-backend (minimal)' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// ---------- Error Handling ----------
app.use(notFound);
app.use(errorHandler);

// ---------- HTTP + Socket.IO ----------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
});
attachMeetingSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Whizz backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`🔌 Socket.IO signaling attached`);
});
