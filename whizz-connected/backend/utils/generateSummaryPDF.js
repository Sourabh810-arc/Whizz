const PDFDocument = require('pdfkit');

/**
 * Renders a meeting's AI summary/minutes/action items into a PDF buffer.
 * Used both for the direct download endpoint and as an email attachment.
 */
function generateSummaryPDF(meeting) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ---------- Header ----------
    doc.fillColor('#4F46E5').fontSize(22).text('Whizz — Meeting Summary', { align: 'left' });
    doc.moveDown(0.3);
    doc.fillColor('#111827').fontSize(16).text(meeting.title);
    doc
      .fillColor('#6B7280')
      .fontSize(10)
      .text(`Meeting ID: ${meeting.meetingId}`)
      .text(`Date: ${new Date(meeting.startedAt || meeting.createdAt).toLocaleString()}`)
      .text(`Participants: ${meeting.participants.map((p) => p.name).join(', ') || 'N/A'}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown();

    // ---------- Summary ----------
    doc.fillColor('#4F46E5').fontSize(13).text('AI Summary');
    doc.moveDown(0.3);
    doc
      .fillColor('#374151')
      .fontSize(11)
      .text(meeting.aiSummary || 'No summary generated.', { align: 'left' });
    doc.moveDown();

    // ---------- Minutes ----------
    doc.fillColor('#4F46E5').fontSize(13).text('Meeting Minutes');
    doc.moveDown(0.3);
    doc
      .fillColor('#374151')
      .fontSize(10)
      .text(meeting.aiMinutes || 'No minutes recorded.', { align: 'left' });
    doc.moveDown();

    // ---------- Action Items ----------
    doc.fillColor('#4F46E5').fontSize(13).text('Action Items');
    doc.moveDown(0.3);
    if (meeting.actionItems?.length) {
      meeting.actionItems.forEach((item, i) => {
        doc
          .fillColor('#374151')
          .fontSize(11)
          .text(`${i + 1}. [${item.owner || 'Unassigned'}] ${item.text}`);
      });
    } else {
      doc.fillColor('#9CA3AF').fontSize(11).text('No action items extracted.');
    }

    doc.end();
  });
}

module.exports = generateSummaryPDF;
