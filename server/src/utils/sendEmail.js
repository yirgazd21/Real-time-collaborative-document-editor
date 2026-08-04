const nodemailer = require("nodemailer");

/**
 * Utility function to send emails via Nodemailer / SMTP
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  // If SMTP user is missing, log the dispatch notice clearly
  if (!process.env.SMTP_USER) {
    console.log("\n=======================================================");
    console.log(`📧 [EMAIL DISPATCH - NO SMTP_USER ENV SET]`);
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log("=======================================================\n");
    return;
  }

  try {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const isGmail = host.includes("gmail");

    const transporterConfig = isGmail
      ? {
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      : {
          host,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_PORT === "465" || process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        };

    const transporter = nodemailer.createTransport(transporterConfig);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `SyncWrite Support <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL DISPATCHED SUCCESSFULLY] To: ${options.email} (ID: ${info.messageId})`);
  } catch (err) {
    console.error(`❌ [NODEMAILER ERROR] Failed to send email to ${options.email}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
