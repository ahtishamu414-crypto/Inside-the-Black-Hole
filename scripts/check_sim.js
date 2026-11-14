import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function checkSim() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Dismiss guide
  await page.evaluate(() => {
    localStorage.setItem('bh5000_guide_seen', '1');
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // Let's inspect buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
  });
  console.log('Buttons on page:', buttons.slice(0, 15));

  // Let's click START
  await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'START');
    if (s) s.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Check top status bar
  const topText = await page.evaluate(() => {
    return document.body.innerText.slice(0, 400);
  });
  console.log('Top bar text after START:\n', topText.slice(0, 250));

  await browser.close();
}

checkSim().catch(console.error);

