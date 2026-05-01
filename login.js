	require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
const reportsDir = path.join(__dirname, 'reports');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Define multiple login credentials (loaded from .env)
const credentials = [
  { email: process.env.TEST_USER_EMAIL, password: process.env.TEST_USER_PASSWORD },
  { email: process.env.TEST_USER_2_EMAIL, password: process.env.TEST_USER_2_PASSWORD },
  { email: process.env.TEST_USER_3_EMAIL, password: process.env.TEST_USER_3_PASSWORD },
].filter(c => c.email && c.password);

// Group form data for add group functionality
const groupData = {
  name: 'Test Group ' + new Date().toISOString().slice(0, 10),
  description: 'Automated test group created by Playwright'
};

async function loginToWebApp(email, password, index, maxRetries = 2) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const result = {
    email,
    status: 'FAILED',
    message: '',
    screenshot: '',
    attempts: 0,
    retries: 0
  };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    result.attempts = attempt;
    
    try {
      console.log(`\n--- Attempting login for: ${email} (Attempt ${attempt}/${maxRetries + 1}) ---`);
      console.log('Navigating to login page...');
      await page.goto(`${process.env.APP_BASE_URL}/login`, { waitUntil: 'networkidle' });

      console.log('Filling in email...');
      await page.getByTestId('email-input').fill(email);

      console.log('Filling in password...');
      await page.getByTestId('password-input').fill(password);

      console.log('Clicking login button...');
      await page.getByTestId('login-btn').click();

      console.log('Waiting for navigation...');
      await page.waitForNavigation({ waitUntil: 'networkidle' });

      console.log('✓ Login successful!');
      console.log('Current URL:', page.url());

      // Keep browser open for 3 seconds to see the result
      await page.waitForTimeout(3000);

      // Capture success screenshot
      const screenshotName = `${index}_${email.split('@')[0]}_success_attempt${attempt}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotName);
      await page.screenshot({ path: screenshotPath });
      result.status = 'PASSED';
      result.message = `Successfully logged in on attempt ${attempt}. URL: ${page.url()}`;
      result.screenshot = screenshotPath;
      result.retries = attempt - 1;
      console.log(`📸 Screenshot saved: ${screenshotName}`);
      break; // Success, exit retry loop
      
    } catch (error) {
      console.error(`✗ Login failed on attempt ${attempt}:`, error.message);
      
      if (attempt <= maxRetries) {
        console.log(`🔄 Retrying... (${attempt}/${maxRetries})`);
        result.retries = attempt;
        // Wait before retry
        await page.waitForTimeout(2000);
        continue;
      } else {
        // Final attempt failed
        result.message = `Failed after ${maxRetries + 1} attempts. Last error: ${error.message}`;
        
        // Capture failure screenshot
        try {
          const screenshotName = `${index}_${email.split('@')[0]}_failed_final.png`;
          const screenshotPath = path.join(screenshotsDir, screenshotName);
          await page.screenshot({ path: screenshotPath });
          result.screenshot = screenshotPath;
          console.log(`📸 Final failure screenshot saved: ${screenshotName}`);
        } catch (e) {
          console.log('Could not capture failure screenshot');
        }
        break;
      }
    }
  }

  await browser.close();
  return result;
}

// Run login for each credential
async function runMultipleLogins(maxRetries = 2) {
  console.log('🚀 Starting multi-login automation...');
  console.log(`🔄 Retry logic enabled: ${maxRetries} retries per failed login`);
  const results = [];
  
  for (let i = 0; i < credentials.length; i++) {
    const cred = credentials[i];
    const result = await loginToWebApp(cred.email, cred.password, i + 1, maxRetries);
    results.push(result);
  }
  
  // Generate summary
  generateSummary(results, maxRetries);
}

function generateSummary(results, maxRetries) {
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const total = results.length;
  const totalRetries = results.reduce((sum, r) => sum + r.retries, 0);
  const executionTime = new Date().toLocaleString();
  const duration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  // Generate HTML Report
  const htmlReport = generateHTMLReport(results, {
    passed,
    failed,
    total,
    totalRetries,
    executionTime,
    duration,
    maxRetries
  });

  // Save HTML report
  const reportFileName = `login_test_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
  const reportPath = path.join(reportsDir, reportFileName);
  fs.writeFileSync(reportPath, htmlReport);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(2)}%`);
  console.log(`🔄 Total Retries Used: ${totalRetries}`);
  console.log(`📈 Retry Efficiency: ${totalRetries > 0 ? ((passed / (total + totalRetries)) * 100).toFixed(2) : 100}%`);
  console.log('='.repeat(60));

function generateHTMLReport(results, stats) {
  const { passed, failed, total, totalRetries, executionTime, duration, maxRetries } = stats;

  // Generate result rows
  const resultRows = results.map((result, index) => {
    const statusClass = result.status === 'PASSED' ? 'status-passed' : 'status-failed';
    const statusIcon = result.status === 'PASSED' ? '✓' : '✗';
    const screenshotCell = result.screenshot ?
      `<td><a href="${result.screenshot.replace(/\\/g, '/').replace(__dirname, '.')}">View Screenshot</a></td>` :
      '<td>No screenshot</td>';

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${result.email}</td>
        <td class="${statusClass}">${statusIcon} ${result.status}</td>
        <td>${result.attempts}/${maxRetries + 1}</td>
        <td>${result.retries}</td>
        <td>${result.message}</td>
        ${screenshotCell}
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Automation Test Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }

        .metric {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .metric h3 {
            font-size: 2em;
            margin-bottom: 5px;
        }

        .metric p {
            color: #666;
            font-size: 0.9em;
        }

        .metric-passed { border-left: 4px solid #28a745; }
        .metric-failed { border-left: 4px solid #dc3545; }
        .metric-total { border-left: 4px solid #007bff; }
        .metric-retries { border-left: 4px solid #ffc107; }

        .results-section {
            padding: 30px;
        }

        .results-section h2 {
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        th {
            background: #007bff;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
        }

        tr:nth-child(even) {
            background: #f8f9fa;
        }

        tr:hover {
            background: #e3f2fd;
        }

        .status-passed {
            color: #28a745;
            font-weight: bold;
        }

        .status-failed {
            color: #dc3545;
            font-weight: bold;
        }

        a {
            color: #007bff;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }

        .execution-info {
            background: #e9ecef;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Login Automation Test Report</h1>
            <p>Automated login testing with retry logic and screenshot capture</p>
        </div>

        <div class="execution-info">
            <strong>Execution Time:</strong> ${executionTime} |
            <strong>Test Environment:</strong> Playwright + Chromium |
            <strong>Max Retries:</strong> ${maxRetries}
        </div>

        <div class="summary">
            <div class="metric metric-total">
                <h3>${total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="metric metric-passed">
                <h3>${passed}</h3>
                <p>Passed</p>
            </div>
            <div class="metric metric-failed">
                <h3>${failed}</h3>
                <p>Failed</p>
            </div>
            <div class="metric metric-retries">
                <h3>${totalRetries}</h3>
                <p>Total Retries</p>
            </div>
        </div>

        <div class="results-section">
            <h2>📋 Detailed Test Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Attempts</th>
                        <th>Retries</th>
                        <th>Message</th>
                        <th>Screenshot</th>
                    </tr>
                </thead>
                <tbody>
                    ${resultRows}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Report generated by Playwright Login Automation Framework</p>
            <p>Screenshots and reports saved in project directories</p>
        </div>
    </div>
</body>
</html>`;
}
  results.forEach((result, index) => {
    const statusSymbol = result.status === 'PASSED' ? '✓' : '✗';
    console.log(`\n${index + 1}. ${statusSymbol} ${result.email}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Attempts: ${result.attempts}/${maxRetries + 1}`);
    console.log(`   Retries Used: ${result.retries}`);
    console.log(`   Message: ${result.message}`);
    if (result.screenshot) {
      console.log(`   Screenshot: ${result.screenshot}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ All logins completed!');
  console.log(`📁 Screenshots saved in: ${screenshotsDir}`);
  console.log(`📄 HTML Report saved: ${reportPath}`);
  console.log('='.repeat(60) + '\n');
}

runMultipleLogins(2); // 2 retries per failed login