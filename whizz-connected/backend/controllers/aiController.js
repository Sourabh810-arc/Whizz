const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { generateMeetingIntelligence } = require('../utils/aiSummary');
const generateSummaryPDF = require('../utils/generateSummaryPDF');
const sendEmail = require('../utils/sendEmail');

// A user may generate/view a summary if they hosted the meeting or were
// ever a participant in it.
function assertHasAccess(res, meeting, userId) {
  const uid = userId.toString();
  const isHost = meeting.host.toString() === uid;
  const wasParticipant = meeting.participants.some((p) => p.user?.toString() === uid);
  if (!isHost && !wasParticipant) {
    res.status(403);
    throw new Error('You do not have access to this meeting');
  }
  return isHost;
}

// @desc    Generate (or regenerate) the AI summary/minutes/action items
// @route   POST /api/ai/:meetingId/summary
const generateSummary = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  assertHasAccess(res, meeting, req.user._id);

  const { summary, minutes, actionItems } = await generateMeetingIntelligence(meeting);

  meeting.aiSummary = summary;
  meeting.aiMinutes = minutes;
  meeting.actionItems = actionItems;
  await meeting.save();

  res.json({ success: true, summary, minutes, actionItems });
});

// @desc    Download the AI summary as a PDF
// @route   GET /api/ai/:meetingId/summary/pdf
const downloadSummaryPDF = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  assertHasAccess(res, meeting, req.user._id);

  if (!meeting.aiSummary) {
    res.status(400);
    throw new Error('Generate the AI summary first');
  }

  const pdfBuffer = await generateSummaryPDF(meeting);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="whizz-summary-${meeting.meetingId}.pdf"`);
  res.send(pdfBuffer);
});

// @desc    Email the AI summary (as a PDF attachment) to everyone who
//          attended the meeting. Host only — it fans out to the whole group.
// @route   POST /api/ai/:meetingId/summary/email
const emailSummary = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId }).populate(
    'participants.user',
    'name email'
  );
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  const isHost = meeting.host.toString() === req.user._id.toString();
  if (!isHost) {
    res.status(403);
    throw new Error('Only the host can email the summary to participants');
  }

  if (!meeting.aiSummary) {
    res.status(400);
    throw new Error('Generate the AI summary first');
  }

  const host = await User.findById(meeting.host).select('name email');
  const recipientEmails = new Set();
  if (host?.email) recipientEmails.add(host.email);
  meeting.participants.forEach((p) => {
    if (p.user?.email) recipientEmails.add(p.user.email);
  });

  if (recipientEmails.size === 0) {
    res.status(400);
    throw new Error('No participant email addresses on file for this meeting');
  }

  const pdfBuffer = await generateSummaryPDF(meeting);

  await sendEmail({
    to: Array.from(recipientEmails).join(','),
    subject: `Whizz — Summary for "${meeting.title}"`,
    html: `<div style="font-family:sans-serif">
            <h2 style="color:#4F46E5">Meeting Summary: ${meeting.title}</h2>
            <p>${meeting.aiSummary}</p>
            <p style="color:#6B7280;font-size:13px">Full minutes and action items are attached as a PDF.</p>
          </div>`,
    attachments: [
      {
        filename: `whizz-summary-${meeting.meetingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  meeting.summaryEmailSent = true;
  await meeting.save();

  res.json({ success: true, message: `Summary emailed to ${recipientEmails.size} participant(s)` });
});

module.exports = { generateSummary, downloadSummaryPDF, emailSummary };
