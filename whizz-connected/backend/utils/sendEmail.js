const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, attachments }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // In development, log emails instead of sending if no real credentials
  if (process.env.NODE_ENV === 'development' && (!smtpUser || smtpUser === 'your_email@gmail.com' || !smtpPass || smtpPass === 'your_app_password')) {
    console.log('📧 [DEV] Email would be sent to:', to);
    console.log('📧 [DEV] Subject:', subject);
    console.log('📧 [DEV] HTML:', html);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    attachments,
  });
};

module.exports = sendEmail;
