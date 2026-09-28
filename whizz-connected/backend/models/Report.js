const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', default: null },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
