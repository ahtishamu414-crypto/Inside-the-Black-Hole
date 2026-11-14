import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testTeamVote() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Close guide
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sp = btns.find(b => b.textContent.includes('START PLAYING'));
    if (sp) sp.click();
    else {
      btns.filter(b => b.textContent.includes('NEXT')).forEach(b => b.click());
      const sp2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
      if (sp2) sp2.click();
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Reset
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const r = btns.find(b => b.textContent.trim() === 'RESET');
    if (r) r.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Click TEAM button
  const clickedTeam = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const t = btns.find(b => b.textContent.trim() === 'TEAM');
    if (t) {
      t.click();
      return true;
    }
    return false;
  });
  console.log('Clicked TEAM button:', clickedTeam);
  await new Promise(r => setTimeout(r, 200));

  // Click START button
  const clickedStart = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const s = btns.find(b => b.textContent.trim() === 'START');
    if (s) {
      s.click();
      return true;
    }
    return false;
  });
  console.log('Clicked START button:', clickedStart);
  await new Promise(r => setTimeout(r, 200));

  // Check if vote modal is open
  const modalText = await page.evaluate(() => {
    return document.body.innerText;
  });
  console.log('Contains CONFIRM & LAUNCH:', modalText.includes('CONFIRM & LAUNCH'));
  console.log('Contains TEAM CONSENSUS:', modalText.includes('TEAM CONSENSUS'));

  await browser.close();
}

testTeamVote().catch(console.error);

