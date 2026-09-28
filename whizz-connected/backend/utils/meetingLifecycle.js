const Meeting = require('../models/Meeting');

/**
 * Records that a user left a meeting, and auto-ends the meeting (so it moves
 * into "history") when either:
 *  - the host leaves (this app has no co-host/reassignment flow), or
 *  - every participant who ever joined has now left.
 *
 * This is what makes "Recent Meetings" actually populate: previously a
 * meeting only became `ended` if the host clicked "End for Everyone" — if
 * the host just closed the tab, or a participant simply left, the meeting
 * stayed "ongoing" forever and never showed up in history.
 */
async function recordParticipantLeave(meetingId, userId) {
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting || meeting.status === 'ended' || !userId) return meeting;

  const participant = meeting.participants.find(
    (p) => p.user?.toString() === userId.toString() && !p.leftAt
  );
  if (participant) participant.leftAt = new Date();

  const hostIsLeaving = meeting.host.toString() === userId.toString();
  const everyoneLeft =
    meeting.participants.length > 0 && meeting.participants.every((p) => p.leftAt);

  if (hostIsLeaving || everyoneLeft) {
    meeting.status = 'ended';
    meeting.endedAt = meeting.endedAt || new Date();
    meeting.participants.forEach((p) => {
      if (!p.leftAt) p.leftAt = new Date();
    });
  }

  await meeting.save();
  return meeting;
}

module.exports = { recordParticipantLeave };
