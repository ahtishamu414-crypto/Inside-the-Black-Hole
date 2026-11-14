import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function detailedCompare() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-web-security', '--window-size=1440,900']
  });

  const pageProto = await browser.newPage();
  await pageProto.setViewport({ width: 1440, height: 900 });
  const protoUrl = 'file:///' + path.resolve('Mission Control.dc.html').replace(/\\/g, '/');
  await pageProto.goto(protoUrl, { waitUntil: 'networkidle0' });

  const pageReact = await browser.newPage();
  await pageReact.setViewport({ width: 1440, height: 900 });
  await pageReact.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Dismiss guide on both
  await pageProto.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sp = btns.find(b => b.textContent.includes('START PLAYING'));
    if (sp) sp.click();
    else {
      btns.filter(b => b.textContent.includes('NEXT')).forEach(b => b.click());
      const sp2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
      if (sp2) sp2.click();
    }
  });

  await pageReact.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sp = btns.find(b => b.textContent.includes('START PLAYING'));
    if (sp) sp.click();
    else {
      btns.filter(b => b.textContent.includes('NEXT')).forEach(b => b.click());
      const sp2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
      if (sp2) sp2.click();
    }
  });

  const screens = [
    { id: 'overview', n: '01' },
    { id: 'swarm', n: '02' },
    { id: 'td', n: '03' },
    { id: 'env', n: '04' },
    { id: 'grrt', n: '05' },
    { id: 'sim', n: '06' },
    { id: 'analytics', n: '07' }
  ];

  const results = {};

  for (const s of screens) {
    // Navigate proto
    await pageProto.evaluate((n) => {
      const items = Array.from(document.querySelectorAll('div'));
      const target = items.find(el => el.textContent && el.textContent.trim().startsWith(n));
      if (target) target.click();
    }, s.n);

    // Navigate react
    await pageReact.evaluate((id) => {
      const target = document.querySelector(`[data-nav="${id}"]`);
      if (target) target.click();
    }, s.id);

    await new Promise(r => setTimeout(r, 400));

    // Extract text and elements count
    const protoData = await pageProto.evaluate(() => {
      const main = document.querySelector('div[style*="min-width:1180px"]') || document.body;
      const canvases = Array.from(main.querySelectorAll('canvas')).map(c => ({
        w: c.width,
        h: c.height,
        kind: c.dataset.kind || '',
        chart: c.dataset.chart || '',
        g: c.dataset.g || ''
      }));
      const buttons = Array.from(main.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean);
      const text = main.innerText;
      return { canvases, buttonsCount: buttons.length, textSnippet: text.slice(0, 200) };
    });

    const reactData = await pageReact.evaluate(() => {
      const main = document.querySelector('div[style*="min-width: 1180px"]') || document.body;
      const canvases = Array.from(main.querySelectorAll('canvas')).map(c => ({
        w: c.width,
        h: c.height
      }));
      const buttons = Array.from(main.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean);
      const text = main.innerText;
      return { canvases, buttonsCount: buttons.length, textSnippet: text.slice(0, 200) };
    });

    results[s.id] = { proto: protoData, react: reactData };
  }

  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

detailedCompare().catch(console.error);

