# 🔐 Login Automation Framework

Automated login testing with retry logic, screenshot capture, and email delivery.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run login tests
node login_clean.js

# Generate sample report (for testing)
node generate_sample_report.js
```

## 📧 Email Setup

### Gmail Configuration (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Update Email Configuration** in `email-config.js`:
   ```javascript
   smtp: {
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
     auth: {
       user: 'your-email@gmail.com', // Your Gmail address
       pass: 'abcd-efgh-ijkl-mnop' // Your 16-character app password
     }
   }
   ```

### Other Email Providers

#### Outlook/Hotmail:
```javascript
smtp: {
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password'
  }
}
```

#### Yahoo:
```javascript
smtp: {
  host: 'smtp.mail.yahoo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@yahoo.com',
    pass: 'your-app-password'
  }
}
```

#### Corporate SMTP:
```javascript
smtp: {
  host: 'smtp.company.com',
  port: 587, // or 465
  secure: false, // or true
  auth: {
    user: 'your-email@company.com',
    pass: 'your-password'
  }
}
```

## 📧 Email Recipients

Update the `recipients` array in `email-config.js`:

```javascript
recipients: [
  'customer1@company.com',
  'customer2@company.com',
  'qa-team@company.com',
  'manager@company.com'
]
```

## 📊 Features

- ✅ **Multi-login testing** with configurable credentials
- ✅ **Retry logic** (configurable attempts)
- ✅ **Screenshot capture** (success/failure)
- ✅ **Professional HTML reports**
- ✅ **Automated email delivery**
- ✅ **Detailed test metrics**

## 📁 Project Structure

```
├── login_clean.js          # Main automation script
├── email-config.js         # Email configuration
├── email-service.js        # Email sending service
├── generate_sample_report.js # Sample report generator
├── reports/                # Generated HTML reports
├── screenshots/            # Test screenshots
└── package.json
```

## 🔧 Configuration

### Test Credentials

Credentials are loaded from a `.env` file (git-ignored). Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` with real values:

```bash
APP_BASE_URL=http://your-app-url
TEST_USER_EMAIL=user1@domain.com
TEST_USER_PASSWORD=your-password
TEST_USER_2_EMAIL=user2@domain.com
TEST_USER_2_PASSWORD=your-password
TEST_USER_3_EMAIL=user3@domain.com
TEST_USER_3_PASSWORD=your-password
```

### Retry Settings
Modify the retry count in the main execution:

```javascript
runMultipleLogins(3); // 3 retries per failed login
```

## 📧 Email Template Customization

Edit `email-config.js` to customize the email template:

- `subject`: Email subject line
- `from`: Sender information
- `getEmailBody()`: HTML email content

## 🐛 Troubleshooting

### Email Connection Issues
```bash
# Test email connection
node -e "const EmailService = require('./email-service'); const es = new EmailService(); es.testConnection();"
```

### Common Issues
- **"Authentication failed"**: Use app password instead of regular password
- **"Connection timeout"**: Check firewall and SMTP settings
- **"Invalid recipients"**: Verify email addresses are correct

## 📈 Report Features

- **Visual Summary**: Cards showing pass/fail counts
- **Detailed Results**: Table with all test attempts
- **Screenshot Links**: Direct access to visual evidence
- **Retry Metrics**: Efficiency and attempt statistics
- **Professional Design**: Customer-ready presentation

## 🔒 Security Notes

- Never commit email credentials to version control
- Use app passwords instead of regular passwords
- Consider using environment variables for sensitive data
- Regularly rotate app passwords

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify email configuration
3. Test with sample report generator first
4. Check console output for detailed error messages