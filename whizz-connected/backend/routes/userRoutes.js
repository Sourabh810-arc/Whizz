const express = require('express');
const router = express.Router();
const { updateProfile, changePassword, getMeetingHistory } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/meeting-history', getMeetingHistory);

module.exports = router;
