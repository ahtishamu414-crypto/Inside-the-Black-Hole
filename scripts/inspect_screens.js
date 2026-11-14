import fs from 'fs';
const html = fs.readFileSync('Mission Control.dc.html', 'utf8');

const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('s07') || line.includes('s08') || line.includes('Screen 07') || line.includes('Screen 08') || line.includes('Analytics') || line.includes('Outcome')) {
    if (line.includes('<div') || line.includes('<!--') || line.includes('render') || line.includes('case') || line.includes('screen ==')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
