const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT sent in the socket handshake (io(url, { auth: { token } }))
// and attaches the user's id/name to socket.data so the rest of the signaling
// layer can trust who's talking.
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Not authorized, no token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Not authorized, user not found'));
    if (user.status === 'suspended') return next(new Error('Account suspended'));

    socket.data.userId = user._id.toString();
    socket.data.userName = user.name;
    next();
  } catch (err) {
    next(new Error('Not authorized, token failed'));
  }
};

module.exports = socketAuth;
