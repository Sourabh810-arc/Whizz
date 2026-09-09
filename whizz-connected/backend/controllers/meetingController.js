const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const generateMeetingId = require('../utils/generateMeetingId');
const { recordParticipantLeave } = require('../utils/meetingLifecycle');

// @desc    Create an instant meeting
// @route   POST /api/meetings/instant
const createInstantMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.create({
    meetingId: generateMeetingId(),
    title: req.body.title || `${req.user.name}'s Meeting`,
    host: req.user._id,
    type: 'instant',
    status: 'ongoing',
    startedAt: new Date(),
    participants: [{ user: req.user._id, name: req.user.name, joinedAt: new Date() }],
  });

  res.status(201).json({ success: true, meeting });
});

// @desc    Schedule a future meeting
// @route   POST /api/meetings/schedule
const scheduleMeeting = asyncHandler(async (req, res) => {
  const { title, scheduledAt, duration } = req.body;
  if (!scheduledAt) {
    res.status(400);
    throw new Error('scheduledAt is required');
  }

  const meeting = await Meeting.create({
    meetingId: generateMeetingId(),
    title: title || 'Scheduled Meeting',
    host: req.user._id,
    type: 'scheduled',
    status: 'scheduled',
    scheduledAt,
    duration: duration || 30,
  });

  res.status(201).json({ success: true, meeting });
});

// @desc    Get meeting by meetingId (for join screen / room)
// @route   GET /api/meetings/:meetingId
const getMeetingByCode = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
    .populate('host', 'name email avatar')
    .populate('participants.user', 'name avatar');

  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found. Check the meeting ID and try again.');
  }

  res.json({ success: true, meeting });
});

// @desc    Join a meeting (adds user to participants list)
// @route   POST /api/meetings/:meetingId/join
const joinMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  if (meeting.status === 'ended') {
    res.status(400);
    throw new Error('This meeting has already ended');
  }

  const alreadyIn = meeting.participants.find((p) => p.user?.toString() === req.user._id.toString() && !p.leftAt);
  if (!alreadyIn) {
    meeting.participants.push({ user: req.user._id, name: req.user.name, joinedAt: new Date() });
  }
  if (meeting.status === 'scheduled') {
    meeting.status = 'ongoing';
    meeting.startedAt = new Date();
  }
  await meeting.save();

  res.json({ success: true, meeting });
});

// @desc    Leave a meeting (marks this participant as left; auto-ends the
//          meeting — so it shows up in history — if the host left or everyone
//          who joined has now left)
// @route   PUT /api/meetings/:meetingId/leave
const leaveMeeting = asyncHandler(async (req, res) => {
  const meeting = await recordParticipantLeave(req.params.meetingId, req.user._id);
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  res.json({ success: true, meeting });
});

// @desc    Get dashboard data: upcoming meetings, recent meetings
// @route   GET /api/meetings/dashboard/summary
const getDashboardData = asyncHandler(async (req, res) => {
  const now = new Date();

  const upcoming = await Meeting.find({
    host: req.user._id,
    type: 'scheduled',
    status: 'scheduled',
    scheduledAt: { $gte: now },
  })
    .sort({ scheduledAt: 1 })
    .limit(10);

  const recent = await Meeting.find({
    $or: [{ host: req.user._id }, { 'participants.user': req.user._id }],
    status: 'ended',
  })
    .sort({ endedAt: -1 })
    .limit(10);

  const totalMeetings = await Meeting.countDocuments({
    $or: [{ host: req.user._id }, { 'participants.user': req.user._id }],
  });

  res.json({ success: true, upcoming, recent, totalMeetings });
});

// @desc    End meeting for everyone (host only)
// @route   PUT /api/meetings/:meetingId/end
const endMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  if (meeting.host.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the host can end the meeting for everyone');
  }

  meeting.status = 'ended';
  meeting.endedAt = new Date();
  meeting.participants.forEach((p) => {
    if (!p.leftAt) p.leftAt = new Date();
  });
  await meeting.save();

  res.json({ success: true, meeting });
});

module.exports = {
  createInstantMeeting,
  scheduleMeeting,
  getMeetingByCode,
  joinMeeting,
  leaveMeeting,
  getDashboardData,
  endMeeting,
};
