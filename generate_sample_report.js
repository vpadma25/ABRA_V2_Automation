const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

require('dotenv').config();

// Sample test results for demonstration (uses placeholder data, no real creds)
const sampleResults = [
  {
    email: 'user1@example.com',
    status: 'PASSED',
    message: 'Successfully logged in on attempt 1.',
    screenshot: './screenshots/1_user1_success_attempt1.png',
    attempts: 1,
    retries: 0
  },
  {
    email: 'user2@example.com',
    status: 'PASSED',
    message: 'Successfully logged in on attempt 1.',
    screenshot: './screenshots/2_user2_success_attempt1.png',
    attempts: 1,
    retries: 0
  },
  {
    email: 'user3@example.com',
    status: 'FAILED',
    message: 'Failed after 3 attempts. Last error: Timeout waiting for navigation',
    screenshot: './screenshots/3_user3_failed_final.png',
    attempts: 3,
    retries: 2
  }
];

const stats = {
  passed: 2,
  failed: 1,
  total: 3,
  totalRetries: 2,
  executionTime: new Date().toLocaleString(),
  maxRetries: 2
};

function generateHTMLReport(results, stats) {
  const { passed, failed, total, totalRetries, executionTime, maxRetries } = stats;

  // Generate result rows
  const resultRows = results.map((result, index) => {
    const statusClass = result.status === 'PASSED' ? 'status-passed' : 'status-failed';
    const statusIcon = result.status === 'PASSED' ? '✓' : '✗';
    const screenshotCell = result.screenshot ?
      `<td><a href="${result.screenshot}">View Screenshot</a></td>` :
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

// Generate and save the HTML report
const htmlReport = generateHTMLReport(sampleResults, stats);
const reportFileName = `sample_login_test_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
const reportPath = path.join(reportsDir, reportFileName);
fs.writeFileSync(reportPath, htmlReport);

console.log('✅ Sample HTML report generated!');
console.log(`📄 Report saved: ${reportPath}`);
console.log('\n🚀 To run actual tests:');
console.log('node login_clean.js');
console.log('\n📊 Features included:');
console.log('- ✅ Professional HTML report');
console.log('- ✅ Screenshot capture (success/failure)');
console.log('- ✅ Retry logic (configurable)');
console.log('- ✅ Detailed test results');
console.log('- ✅ Summary statistics');
console.log('- ✅ Customer-ready format');