/**
 * ゲームを自動操作して日常パート・説得バトルのスクリーンショットを撮るスクリプト
 * Usage: npx tsx tools/capture-screens.ts [port]
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] || '5199';
const URL = `http://localhost:${PORT}/`;

async function dismissDialogs(page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>) {
  for (let i = 0; i < 5; i++) {
    const okBtn = page.locator('button:has-text("OK"), button:has-text("閉じる")');
    if (await okBtn.count() > 0) {
      await okBtn.first().click({ force: true });
      await page.waitForTimeout(400);
    } else {
      break;
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ========== 1. 日常パートのキャプチャ ==========
  console.log('=== Capturing daily screen ===');
  const page1 = await browser.newPage({ viewport: { width: 430, height: 800 } });
  await page1.addInitScript(() => {
    HTMLMediaElement.prototype.play = async function () {};
  });
  await page1.goto(URL, { waitUntil: 'networkidle' });
  await page1.waitForTimeout(1000);

  // タイトル → ゲームスタート
  await page1.locator('#start-btn').click({ force: true });
  await page1.waitForTimeout(1000);

  // プロローグスキップ
  const skipBtn = page1.locator('#prologue-skip');
  if (await skipBtn.count() > 0) {
    await skipBtn.click({ force: true });
    await page1.waitForTimeout(1000);
  }

  // 派閥タブ選択 → キャラ選択
  await page1.locator('.faction-tab').first().click({ force: true });
  await page1.waitForTimeout(800);
  await page1.locator('[data-student-id]').first().click({ force: true });
  await page1.waitForTimeout(1500);

  // ダイアログ閉じ
  await dismissDialogs(page1);
  await page1.waitForTimeout(500);

  // 部屋に入れていない場合は入る
  const enterRoom = page1.locator('[data-enter-room]').first();
  if (await enterRoom.count() > 0) {
    await enterRoom.click({ force: true });
    await page1.waitForTimeout(1000);
    await dismissDialogs(page1);
    await page1.waitForTimeout(500);
  }

  // 日常パートスクリーンショット
  await page1.screenshot({
    path: path.resolve(__dirname, '../public/screen-daily.png'),
    type: 'png',
  });
  console.log('Daily screenshot saved.');
  await page1.close();

  // ========== 2. 説得バトルのキャプチャ（チュートリアルを使用） ==========
  console.log('=== Capturing battle screen via tutorial ===');
  const page2 = await browser.newPage({ viewport: { width: 430, height: 930 } });
  await page2.addInitScript(() => {
    HTMLMediaElement.prototype.play = async function () {};
  });
  await page2.goto(URL, { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1000);

  // タイトル → 説得バトルの遊び方
  await page2.locator('#persuade-tutorial-btn').click({ force: true });
  await page2.waitForTimeout(2000);

  // 「はじめる」ボタンを押してバトル画面に入る
  const startTutBtn = page2.locator('button:has-text("はじめる")');
  await startTutBtn.waitFor({ timeout: 5000 });
  await startTutBtn.click({ force: true });
  await page2.waitForTimeout(2000);

  // チュートリアル中のダイアログを全て進める（バトル画面が見えるまで）
  for (let i = 0; i < 15; i++) {
    const dialogBtn = page2.locator('button:has-text("次へ"), button:has-text("OK"), button:has-text("閉じる")');
    if (await dialogBtn.count() > 0) {
      await dialogBtn.first().click({ force: true });
      await page2.waitForTimeout(600);
    } else {
      break;
    }
  }

  await page2.waitForTimeout(1000);
  // 上部が見えるようにスクロールをトップに
  await page2.evaluate(() => {
    const el = document.querySelector('[style*="overflow"]') || document.documentElement;
    el.scrollTop = 0;
  });
  await page2.waitForTimeout(500);
  await page2.screenshot({
    path: path.resolve(__dirname, '../public/screen-battle.png'),
    type: 'png',
  });
  console.log('Battle screenshot saved.');
  await page2.close();

  await browser.close();
  console.log('Done!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
