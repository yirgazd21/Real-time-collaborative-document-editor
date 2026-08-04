const nodemailer = require("nodemailer");

/**
 * Utility function to send emails via Nodemailer / SMTP
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  // If SMTP user is not configured in .env, fallback to console log in dev environment
  if (!process.env.SMTP_USER && process.env.NODE_ENV !== "production") {
    console.log("\n=======================================================");
    console.log(`📧 [DEV EMAIL DISPATCH] To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log("=======================================================\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `SyncWrite Support <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
