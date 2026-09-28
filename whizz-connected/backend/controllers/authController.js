const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register new user
// @route   POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
    token: generateToken(user._id),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.status === 'suspended') {
    res.status(403);
    throw new Error('Your account has been suspended. Contact support.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
    },
    token: generateToken(user._id),
  });
});

// @desc    Forgot password - sends reset link via email
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always respond success to avoid leaking which emails are registered
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Whizz - Password Reset Request',
      html: `<div style="font-family:sans-serif">
              <h2 style="color:#4F46E5">Reset your Whizz password</h2>
              <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
              <a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset Password</a>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent. Please try again later.');
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. Please log in.' });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { signup, login, forgotPassword, resetPassword, getMe };
