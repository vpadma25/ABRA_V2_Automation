const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const emailConfig = require('./email-config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig.smtp);
  }

  async sendTestReport(stats, reportPath) {
    try {
      console.log('📧 Preparing to send email report...');

      // Read the HTML report file
      const htmlContent = fs.readFileSync(reportPath, 'utf8');

      // Prepare email content
      const subject = emailConfig.subject.replace('{date}', new Date().toLocaleDateString());
      const htmlBody = emailConfig.getEmailBody(stats, reportPath);

      // Email options
      const mailOptions = {
        from: emailConfig.from,
        to: emailConfig.recipients.join(', '),
        subject: subject,
        html: htmlBody,
        attachments: [
          {
            filename: path.basename(reportPath),
            path: reportPath,
            cid: 'report-attachment' // Content-ID for inline attachment
          }
        ]
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`👥 Sent to: ${emailConfig.recipients.length} recipients`);

      return {
        success: true,
        messageId: info.messageId,
        recipients: emailConfig.recipients.length
      };

    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection successful');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }
}

module.exports = EmailService;