const EmailService = require('./email-service');

async function testEmailSetup() {
  console.log('🧪 Testing Email Configuration...\n');

  const emailService = new EmailService();

  // Test 1: Connection
  console.log('1️⃣ Testing SMTP connection...');
  const connectionOk = await emailService.testConnection();

  if (!connectionOk) {
    console.log('\n❌ Email setup failed. Please check:');
    console.log('   - SMTP credentials in email-config.js');
    console.log('   - Internet connection');
    console.log('   - Firewall settings');
    console.log('\n📖 See README.md for detailed setup instructions');
    return;
  }

  // Test 2: Send test email
  console.log('\n2️⃣ Sending test email...');

  // Create a simple test report
  const testStats = {
    passed: 2,
    failed: 0,
    total: 2,
    totalRetries: 0,
    executionTime: new Date().toLocaleString()
  };

  // Create a temporary test report file
  const fs = require('fs');
  const path = require('path');
  const testReportPath = path.join(__dirname, 'test_report.html');

  const testReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;}</style>
</head>
<body>
    <h1>🧪 Email Test Report</h1>
    <p>This is a test email to verify your email configuration is working.</p>
    <p><strong>Test Results:</strong></p>
    <ul>
        <li>✅ SMTP Connection: Successful</li>
        <li>✅ Email Delivery: Testing...</li>
    </ul>
    <p>If you received this email, your configuration is working correctly!</p>
</body>
</html>`;

  fs.writeFileSync(testReportPath, testReport);

  // Send test email
  const result = await emailService.sendTestReport(testStats, testReportPath);

  // Clean up test file
  fs.unlinkSync(testReportPath);

  if (result.success) {
    console.log('\n✅ Email test successful!');
    console.log(`📧 Test email sent to ${result.recipients} recipients`);
    console.log('🎉 Your email configuration is ready for production use!');
  } else {
    console.log('\n❌ Email test failed:', result.error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   - Verify email credentials');
    console.log('   - Check recipient email addresses');
    console.log('   - Ensure app password is correct (for Gmail)');
  }
}

// Run the test
testEmailSetup().catch(console.error);