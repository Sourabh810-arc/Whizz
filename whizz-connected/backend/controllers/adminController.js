const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Report = require('../models/Report');

// @desc    Dashboard analytics (totals + a 30-day activity chart)
// @route   GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [totalUsers, totalMeetings, ongoingMeetings, activeToday, meetingsPerDayRaw] = await Promise.all([
    User.countDocuments(),
    Meeting.countDocuments(),
    Meeting.countDocuments({ status: 'ongoing' }),
    Meeting.countDocuments({ createdAt: { $gte: startOfToday } }),
    Meeting.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Fill in any gaps so the bar chart always shows a full 30-day run, even
  // for days with zero meetings.
  const countsByDay = new Map(meetingsPerDayRaw.map((d) => [d._id, d.count]));
  const meetingsPerDay = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    meetingsPerDay.push({ _id: key, count: countsByDay.get(key) || 0 });
  }

  res.json({
    success: true,
    analytics: { totalUsers, totalMeetings, ongoingMeetings, activeToday, meetingsPerDay },
  });
});

// @desc    List all users
// @route   GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// @desc    Suspend / reactivate a user
// @route   PUT /api/admin/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    res.status(400);
    throw new Error('Status must be "active" or "suspended"');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Admins cannot be suspended');
  }

  user.status = status;
  await user.save();

  res.json({ success: true, user: { _id: user._id, status: user.status } });
});

// @desc    List all meetings (for moderation/oversight)
// @route   GET /api/admin/meetings
const getMeetings = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find()
    .populate('host', 'name email')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, meetings });
});

// @desc    File a report (any authenticated user — e.g. reporting a
//          disruptive participant mid-call)
// @route   POST /api/admin/reports
const createReport = asyncHandler(async (req, res) => {
  const { reportedUser, meeting, reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('A reason is required');
  }

  const report = await Report.create({
    reportedBy: req.user._id,
    reportedUser: reportedUser || null,
    meeting: meeting || null,
    reason,
  });

  // Keep the legacy per-meeting flag in sync for quick filtering.
  if (meeting) {
    await Meeting.updateOne({ _id: meeting }, { reported: true, reportReason: reason });
  }

  res.status(201).json({ success: true, report });
});

// @desc    List all reports
// @route   GET /api/admin/reports
const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('reportedBy', 'name email')
    .populate('reportedUser', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, reports });
});

// @desc    Update a report's status (reviewed / actioned / dismissed)
// @route   PUT /api/admin/reports/:id
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  report.status = status;
  await report.save();

  res.json({ success: true, report });
});

module.exports = {
  getAnalytics,
  getUsers,
  updateUserStatus,
  getMeetings,
  createReport,
  getReports,
  updateReportStatus,
};
