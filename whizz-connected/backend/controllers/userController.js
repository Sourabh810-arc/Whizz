const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Meeting = require('../models/Meeting');

// @desc    Update profile (name, avatar, preferred language)
// @route   PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name ?? user.name;
  user.avatar = req.body.avatar ?? user.avatar;
  user.preferredLanguage = req.body.preferredLanguage ?? user.preferredLanguage;

  const updated = await user.save();
  res.json({
    success: true,
    user: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      preferredLanguage: updated.preferredLanguage,
    },
  });
});

// @desc    Change password
// @route   PUT /api/users/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc    Get logged-in user's meeting history
// @route   GET /api/users/meeting-history
const getMeetingHistory = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({
    $or: [{ host: req.user._id }, { 'participants.user': req.user._id }],
  })
    .sort({ createdAt: -1 })
    .select('meetingId title status type scheduledAt startedAt endedAt participants host');

  res.json({ success: true, meetings });
});

module.exports = { updateProfile, changePassword, getMeetingHistory };
