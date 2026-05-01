const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../docs/dist.js');
const indexPath = path.join(__dirname, '../docs/index.html');

if (!fs.existsSync(distPath)) {
  console.error('dist.js not found. Run webpack first.');
  process.exit(1);
}

const distContent = fs.readFileSync(distPath, 'utf-8');
let html = fs.readFileSync(indexPath, 'utf-8');

// Embed dist.js content between markers
const startMarker = '<!-- DIST_START -->';
const endMarker = '<!-- DIST_END -->';
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find DIST_START/DIST_END markers in index.html');
  process.exit(1);
}

const escaped = distContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const replacement =
  startMarker +
  `\n<script id="ifa-dist-code" type="text/plain">${distContent}</script>\n` +
  `<script>` +
  `window.__IFA_DIST__=document.getElementById('ifa-dist-code').textContent;` +
  `</script>\n` +
  endMarker;

html = html.slice(0, startIdx) + replacement + html.slice(endIdx + endMarker.length);

fs.writeFileSync(indexPath, html);
console.log(`Updated docs/index.html with dist.js (${(distContent.length / 1024).toFixed(1)}KB)`);
