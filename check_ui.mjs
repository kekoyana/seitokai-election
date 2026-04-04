import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173');

// タイトル画面 → ゲーム開始
await page.waitForSelector('text=ゲームスタート', { timeout: 5000 });
await page.click('text=ゲームスタート');
await page.waitForTimeout(500);

// キャラ選択 → 最初のキャラを選ぶ
await page.waitForSelector('[data-select-student]', { timeout: 5000 });
await page.click('[data-select-student]');
await page.waitForTimeout(300);

// 確定ボタン
const confirmBtn = await page.$('text=この生徒でゲーム開始');
if (confirmBtn) {
  await confirmBtn.click();
  await page.waitForTimeout(500);
}

// 日常画面に来たはず。スクリーンショット（通常状態）
await page.screenshot({ path: '/tmp/daily_normal.png', fullPage: false });

// プレイヤーアイコンをクリックして情報を表示
const playerIcon = await page.$('#player-icon');
if (playerIcon) {
  await playerIcon.click();
  await page.waitForTimeout(500);
}

// プレイヤー情報表示状態のスクリーンショット
await page.screenshot({ path: '/tmp/daily_player_info.png', fullPage: false });

// スクロールして下部も確認
await page.evaluate(() => {
  const scrollable = document.querySelector('[style*="overflow-y:auto"]');
  if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
});
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/daily_player_info_scrolled.png', fullPage: false });

await browser.close();
console.log('Screenshots saved');
