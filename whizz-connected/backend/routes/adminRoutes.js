const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  updateUserStatus,
  getMeetings,
  createReport,
  getReports,
  updateReportStatus,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);

// Any signed-in user can file a report (e.g. reporting a participant
// mid-call) — everything else here is admin-only.
router.post('/reports', createReport);

router.get('/analytics', admin, getAnalytics);
router.get('/users', admin, getUsers);
router.put('/users/:id/status', admin, updateUserStatus);
router.get('/meetings', admin, getMeetings);
router.get('/reports', admin, getReports);
router.put('/reports/:id', admin, updateReportStatus);

module.exports = router;
