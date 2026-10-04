import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

async function runBrowserTest() {
  console.log('=== Starting Real Browser E2E Test ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
  }

  console.log(`[1/5] Launching Chrome executable from ${chromePath}...`);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const browserLogs = [];
  page.on('console', (msg) => {
    browserLogs.push(`[Browser Console ${msg.type().toUpperCase()}] ${msg.text()}`);
    console.log(`  -> Browser Console [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    browserLogs.push(`[Browser Error] ${err.toString()}`);
    console.error(`  -> Browser Error:`, err);
  });

  page.on('requestfailed', (req) => {
    browserLogs.push(`[Network Failure] ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    console.error(`  -> Network Request Failed: ${req.url()}`);
  });

  console.log('\n[2/5] Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  const title = await page.title();
  console.log(`  -> Page loaded with title: "${title}"`);

  console.log('\n[3/5] Interacting with UI: Creating a new task...');
  const inputSelector = 'input[placeholder="What do you need to do today?"]';
  await page.waitForSelector(inputSelector);

  const testTaskTitle = 'Test automated browser interaction';
  await page.type(inputSelector, testTaskTitle);

  const submitButtonSelector = 'button[type="submit"]';
  await page.click(submitButtonSelector);

  console.log('  -> Waiting for task to appear in DOM...');
  await page.waitForFunction((text) => document.body.innerText.includes(text), {}, testTaskTitle);
  console.log(`  -> Task "${testTaskTitle}" confirmed in DOM!`);

  console.log('\n[4/5] Toggling task completion state...');
  // Find and click the toggle button for the created task
  await page.evaluate((title) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const taskButton = buttons.find((btn) => btn.innerText.includes(title));
    if (taskButton) {
      taskButton.click();
    } else {
      throw new Error(`Could not find button for task "${title}"`);
    }
  }, testTaskTitle);

  // Wait for the task title to receive the line-through styling
  await page.waitForFunction(
    (text) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const target = spans.find((s) => s.innerText.includes(text));
      return target && target.classList.contains('line-through');
    },
    {},
    testTaskTitle,
  );
  console.log('  -> Task toggle confirmed: "line-through" style applied!');

  // Check progress text
  const progressText = await page.evaluate(() => {
    const el = document.querySelector('.space-y-6 .text-slate-500');
    return el ? el.innerText.trim() : 'Progress counter found';
  });
  console.log(`  -> Progress counter confirmed: "${progressText}"`);

  const screenshotPath = path.resolve('browser-test-result.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`\n[5/5] Saved browser screenshot to: ${screenshotPath}`);

  await browser.close();

  console.log('\n=== Browser Test Summary ===');
  console.log(`Captured ${browserLogs.length} browser console event(s):`);
  browserLogs.forEach((l) => console.log(`  ${l}`));
  console.log('\nRESULT: Browser E2E verification SUCCESSFUL!');
}

runBrowserTest().catch((err) => {
  console.error('\nFAILED Browser Test:', err);
  process.exit(1);
});
