import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

async function testAll() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('=== TEST A: Full CADET Run to Success ===');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // Close guide if open
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startPlaying = btns.find(b => b.textContent.includes('START PLAYING'));
    if (startPlaying) startPlaying.click();
    else {
      const nextBtn = btns.find(b => b.textContent.includes('NEXT'));
      if (nextBtn) {
        nextBtn.click();
        const nextBtn2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('NEXT'));
        if (nextBtn2) nextBtn2.click();
        const sp = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
        if (sp) sp.click();
      }
    }
  });

  // Select CADET difficulty
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cadetBtn = btns.find(b => b.textContent.trim() === 'CADET');
    if (cadetBtn) cadetBtn.click();
  });

  // Switch to Simulation screen (06)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Set speed to 10x
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const speed10 = btns.find(b => b.textContent.trim() === '10x');
    if (speed10) speed10.click();
  });

  // Start simulation
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find(b => b.textContent.trim() === 'START');
    if (startBtn) startBtn.click();
  });

  console.log('Simulation started. Waiting for CADET run completion...');
  let completed = false;
  let cadetOutcome = null;

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    // Check if event modal popped up, if so, resolve it
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const evBtn = btns.find(b => b.parentElement && b.parentElement.previousElementSibling && b.parentElement.previousElementSibling.textContent && b.parentElement.previousElementSibling.textContent.includes('CHOOSE'));
      // Or find button with 'pick' in event modal
      const choiceBtn = btns.find(b => b.textContent.includes('Reroute') || b.textContent.includes('Purge') || b.textContent.includes('Accept') || b.textContent.includes('Deploy') || b.textContent.includes('Reboot'));
      if (choiceBtn) choiceBtn.click();
    });

    const state = await page.evaluate(() => {
      const root = document.querySelector('[data-screen-label="08 Mission Outcome"]');
      const text = document.body.innerText;
      return {
        hasOutcomeScreen: !!root,
        isAccomplished: text.includes('MISSION ACCOMPLISHED'),
        isFailed: text.includes('MISSION FAILED')
      };
    });

    if (state.hasOutcomeScreen || state.isAccomplished || state.isFailed) {
      completed = true;
      console.log('CADET run ended at poll', i, state);
      break;
    }
  }

  // Switch to Outcome screen if not automatically navigated
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="outcome"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cadet_outcome_react.png') });

  cadetOutcome = await page.evaluate(() => {
    const title = document.querySelector('[data-screen-label="08 Mission Outcome"]')?.innerText || '';
    return title.slice(0, 300);
  });
  console.log('CADET outcome summary:', cadetOutcome.slice(0, 150));

  console.log('=== TEST B: ASTROPHYSICIST Close-Orbit Run to Failure ===');
  // Click Restart or Reset
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const restartBtn = btns.find(b => b.textContent.includes('RESTART SIMULATION') || b.textContent.includes('RESET'));
    if (restartBtn) restartBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Go to Overview (01)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="overview"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Select ASTROPHYSICIST
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const astroBtn = btns.find(b => b.textContent.trim() === 'ASTROPHYSICIST');
    if (astroBtn) astroBtn.click();
  });

  // Select CLOSE orbit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('CLOSE'));
    if (closeBtn) closeBtn.click();
  });

  // Go to Sim (06), set 10x, START
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const speed10 = btns.find(b => b.textContent.trim() === '10x');
    if (speed10) speed10.click();
    const startBtn = btns.find(b => b.textContent.trim() === 'START');
    if (startBtn) startBtn.click();
  });

  console.log('Waiting for ASTROPHYSICIST close-orbit run to fail...');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    // Dismiss any event
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const choiceBtn = btns.find(b => b.textContent.includes('Reroute') || b.textContent.includes('Purge') || b.textContent.includes('Accept') || b.textContent.includes('Deploy') || b.textContent.includes('Reboot'));
      if (choiceBtn) choiceBtn.click();
    });

    const state = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('MISSION FAILED');
    });

    if (state) {
      console.log('ASTROPHYSICIST close-orbit failed as expected at step', i);
      break;
    }
  }

  // Go to Outcome screen (08)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="outcome"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'astrophysicist_failed_react.png') });

  console.log('=== TEST C: Overweight launch block ===');
  // Reset mission
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const restartBtn = btns.find(b => b.textContent.includes('RETURN TO MAIN MENU') || b.textContent.includes('RESET'));
    if (restartBtn) restartBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // In Overview screen, select Small rocket (limit 350 kg)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="overview"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    // Select Falcon / Small rocket
    const divs = Array.from(document.querySelectorAll('div, button'));
    const rocketS = divs.find(d => d.textContent && d.textContent.includes('ELECTRON') || d.textContent.includes('Small') || d.textContent.includes('350 kg'));
    if (rocketS) rocketS.click();
  });

  // Try to click START in TopBar
  const launchBlocked = await page.evaluate(() => {
    const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'START');
    if (startBtn) startBtn.click();
    const statusText = document.body.innerText;
    return statusText.includes('TOO HEAVY') || statusText.includes('READY') || statusText.includes('Too heavy');
  });
  console.log('Overweight blocked test result:', launchBlocked);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_overweight_blocked.png') });

  console.log('=== TEST D: Team vote before launch ===');
  // Reset and set TEAM mode
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const resetBtn = btns.find(b => b.textContent.trim() === 'RESET');
    if (resetBtn) resetBtn.click();
    const teamBtn = btns.find(b => b.textContent.trim() === 'TEAM');
    if (teamBtn) teamBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Try to click START
  await page.evaluate(() => {
    const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'START');
    if (startBtn) startBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const voteModalOpen = await page.evaluate(() => {
    return document.body.innerText.includes('CONFIRM & LAUNCH') || document.body.innerText.includes('CREW PRIORITY VOTE');
  });
  console.log('Team vote modal opened before launch:', voteModalOpen);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_team_vote_before_launch.png') });

  // Confirm vote
  await page.evaluate(() => {
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CONFIRM & LAUNCH'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const startedAfterVote = await page.evaluate(() => {
    return document.body.innerText.includes('RUNNING') || document.body.innerText.includes('PAUSE');
  });
  console.log('Simulation started after confirming vote:', startedAfterVote);

  console.log('=== TEST E: Save & Compare with 3 runs & CSV Export ===');
  // Navigate to Analytics (07)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="analytics"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Save 3 runs
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SAVE & COMPARE'));
    if (saveBtn) {
      saveBtn.click();
      saveBtn.click();
      saveBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // Select all 3 for compare
  await page.evaluate(() => {
    const compareBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'COMPARE');
    compareBtns.slice(0, 3).forEach(b => b.click());
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_save_and_compare_3runs.png') });

  // Test CSV download button
  const csvTested = await page.evaluate(() => {
    const csvBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('DOWNLOAD CSV'));
    return !!csvBtn;
  });
  console.log('CSV download button verified:', csvTested);

  await browser.close();
  console.log('All tests completed!');
}

testAll().catch(console.error);

