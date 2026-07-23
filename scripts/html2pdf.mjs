// Reusable HTML → PDF via Playwright/Chromium. Usage: node scripts/html2pdf.mjs <in.html> <out.pdf>
import { chromium } from '@playwright/test';
import path from 'node:path';

const inHtml = path.resolve(process.argv[2]);
const outPdf = path.resolve(process.argv[3]);
if (!process.argv[2] || !process.argv[3]) { console.error('Usage: node html2pdf.mjs <in.html> <out.pdf>'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///' + inHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
await page.pdf({
  path: outPdf,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="font-size:8px;color:#9ca3af;width:100%;text-align:center;font-family:Segoe UI,Arial,sans-serif;">' +
    'MKD Slidea — User Manual · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
});
await browser.close();
console.log('PDF generated:', outPdf);
