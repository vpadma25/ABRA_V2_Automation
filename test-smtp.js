// Quick SMTP test script
const nodemailer = require('nodemailer');
const emailConfig = require('./email-config');

async function testSMTP() {
  console.log('🧪 Testing your corporate SMTP settings...\n');

  const transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: emailConfig.smtp.auth
  });

  try {
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    console.log(`📧 Server: ${emailConfig.smtp.host}:${emailConfig.smtp.port}`);
    console.log(`👤 User: ${emailConfig.smtp.auth.user}`);

    // Test sending a simple email
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: emailConfig.recipients[0],
      subject: 'SMTP Test - Automation Framework',
      text: 'This is a test email to verify your corporate SMTP settings work correctly.'
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📨 Message ID: ${info.messageId}`);

  } catch (error) {
    console.log('❌ SMTP test failed:');
    console.log(`Error: ${error.message}`);

    if (error.code === 'EAUTH') {
      console.log('\n🔐 AUTHENTICATION FAILED');
      console.log('Please check:');
      console.log('- Your email password is correct');
      console.log('- You may need an "App Password" if using 2FA');
      console.log('- Corporate email may require special authentication');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🌐 SERVER NOT FOUND');
      console.log('Please check:');
      console.log('- The SMTP server hostname is correct');
      console.log('- Contact your IT department for correct SMTP settings');
    }
  }
}

testSMTP();