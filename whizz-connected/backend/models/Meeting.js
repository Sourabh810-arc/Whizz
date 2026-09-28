const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const actionItemSchema = new mongoose.Schema(
  {
    text: String,
    owner: String,
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, unique: true }, // human friendly e.g. abc-defg-hij
    title: { type: String, default: 'Untitled Meeting' },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        joinedAt: Date,
        leftAt: Date,
      },
    ],
    type: { type: String, enum: ['instant', 'scheduled'], default: 'instant' },
    scheduledAt: Date,
    duration: Number, // planned duration in minutes (for scheduled)
    status: { type: String, enum: ['scheduled', 'ongoing', 'ended'], default: 'scheduled' },
    startedAt: Date,
    endedAt: Date,
    isLocked: { type: Boolean, default: false },
    waitingRoomEnabled: { type: Boolean, default: true },
    chatLog: [chatMessageSchema],
    notes: { type: String, default: '' },
    transcript: [{ speaker: String, text: String, timestamp: Date }],
    aiSummary: { type: String, default: '' },
    aiMinutes: { type: String, default: '' },
    actionItems: [actionItemSchema],
    filesShared: [{ name: String, url: String, uploadedBy: String, uploadedAt: Date }],
    summaryEmailSent: { type: Boolean, default: false },
    reported: { type: Boolean, default: false },
    reportReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
