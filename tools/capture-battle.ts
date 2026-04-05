/**
 * 説得バトル画面のみキャプチャ（チュートリアル経由）
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] || '5199';
const URL = `http://localhost:${PORT}/`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 600 } });
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = async function () {};
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 説得バトルの遊び方ボタン
  await page.locator('#persuade-tutorial-btn').click({ force: true });
  await page.waitForTimeout(2000);

  // 「はじめる」ボタン
  const startBtn = page.locator('button:has-text("はじめる")');
  await startBtn.waitFor({ timeout: 5000 });
  await startBtn.click({ force: true });
  await page.waitForTimeout(2000);

  // チュートリアルダイアログを全て閉じる
  for (let i = 0; i < 15; i++) {
    const dialogBtn = page.locator('button:has-text("次へ"), button:has-text("OK"), button:has-text("閉じる")');
    if (await dialogBtn.count() > 0) {
      await dialogBtn.first().click({ force: true });
      await page.waitForTimeout(600);
    } else {
      break;
    }
  }

  await page.waitForTimeout(1000);

  // スクロールトップ
  await page.evaluate(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  await page.waitForTimeout(300);

  await page.screenshot({
    path: path.resolve(__dirname, '../public/screen-battle.png'),
    type: 'png',
  });
  console.log('Battle screenshot saved.');

  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
