const express = require('express');
const router = express.Router();
const {
  createInstantMeeting,
  scheduleMeeting,
  getMeetingByCode,
  joinMeeting,
  leaveMeeting,
  getDashboardData,
  endMeeting,
  toggleLock,
  updateNotes,
  addChatMessage,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard/summary', getDashboardData);
router.post('/instant', createInstantMeeting);
router.post('/schedule', scheduleMeeting);
router.get('/:meetingId', getMeetingByCode);
router.post('/:meetingId/join', joinMeeting);
router.put('/:meetingId/leave', leaveMeeting);
router.put('/:meetingId/end', endMeeting);
router.put('/:meetingId/lock', toggleLock);
router.put('/:meetingId/notes', updateNotes);
router.post('/:meetingId/chat', addChatMessage);

module.exports = router;
