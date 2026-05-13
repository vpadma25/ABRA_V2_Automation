// Convert reports/combo_report_combined.html to a PDF using Playwright (Chromium).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlPath = path.resolve(__dirname, 'reports', 'combo_report_combined.html');
  const pdfPath = path.resolve(__dirname, 'reports', 'combo_report_combined.pdf');
  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML not found: ${htmlPath}`);
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
  });
  await browser.close();
  console.log(`✅ PDF generated: ${pdfPath}`);
})();
