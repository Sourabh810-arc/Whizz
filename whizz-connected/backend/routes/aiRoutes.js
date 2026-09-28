const express = require('express');
const router = express.Router();
const { generateSummary, downloadSummaryPDF, emailSummary } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/:meetingId/summary', generateSummary);
router.get('/:meetingId/summary/pdf', downloadSummaryPDF);
router.post('/:meetingId/summary/email', emailSummary);

module.exports = router;
