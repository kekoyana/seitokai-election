import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;

function toDataUrl(filePath: string, mime: string): string {
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${data}`;
}

async function main() {
  const titleBg = toDataUrl(path.resolve(__dirname, '../assets/backgrounds/title.jpg'), 'image/jpeg');
  const portraits = {
    takayama: toDataUrl(path.resolve(__dirname, '../assets/portraits/takayama_seiichi.png'), 'image/png'),
    yuuki: toDataUrl(path.resolve(__dirname, '../assets/portraits/yuuki_akari.png'), 'image/png'),
    shido: toDataUrl(path.resolve(__dirname, '../assets/portraits/shido_tsuyoshi.png'), 'image/png'),
  };
  const screens = {
    daily: toDataUrl(path.resolve(__dirname, '../public/screen-daily.png'), 'image/png'),
    battle: toDataUrl(path.resolve(__dirname, '../public/screen-battle.png'), 'image/png'),
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: url('${titleBg}') center/cover no-repeat;
    font-family: 'Noto Serif JP', serif;
    overflow: hidden;
    position: relative;
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(10,20,40,0.75) 0%, rgba(10,20,40,0.5) 50%, rgba(10,20,40,0.75) 100%);
  }

  /* Title area - top center */
  .title-area {
    position: absolute;
    top: 24px;
    left: 0;
    right: 0;
    text-align: center;
    z-index: 10;
  }
  .title {
    font-size: 72px;
    font-weight: 900;
    font-style: italic;
    color: #fff;
    letter-spacing: 0.06em;
    text-shadow: 0 3px 15px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6);
  }
  .subtitle {
    font-size: 24px;
    font-weight: 700;
    color: #e8d090;
    letter-spacing: 0.15em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.7);
    margin-top: 4px;
  }

  /* Game screens - bottom left & right */
  .screen-frame {
    position: absolute;
    bottom: 30px;
    width: 260px;
    height: 170px;
    border: 3px solid rgba(255,255,255,0.6);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  }
  .screen-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .screen-left { left: 40px; }
  .screen-left img { object-position: center; }
  .screen-right { right: 40px; }
  .screen-right img { object-position: top; }
  .screen-label {
    position: absolute;
    bottom: 6px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0,0,0,0.9);
    background: linear-gradient(transparent, rgba(0,0,0,0.6));
    padding: 8px 0 4px;
  }

  /* Character portraits - center bottom area */
  .portraits {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: flex-end;
    gap: 0;
    z-index: 5;
  }
  .portrait {
    width: 180px;
    height: 320px;
    overflow: hidden;
    position: relative;
  }
  .portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
  .portrait-center {
    width: 200px;
    height: 350px;
    z-index: 2;
  }
  .portrait-side {
    opacity: 0.85;
  }
  .portrait-name {
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0,0,0,0.9);
  }
  .faction-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
    display: inline-block;
    margin-bottom: 2px;
  }
  .faction-conservative { background: rgba(40,80,160,0.8); }
  .faction-progressive { background: rgba(180,50,50,0.8); }
  .faction-sports { background: rgba(40,140,60,0.8); }

  /* Tagline */
  .tagline {
    position: absolute;
    bottom: 380px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.1em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.7);
    z-index: 8;
  }
</style>
</head>
<body>
  <div class="overlay"></div>

  <div class="title-area">
    <div class="title">Academy Tempest</div>
    <div class="subtitle">〜学園の風〜</div>
  </div>

  <div class="tagline">3つの派閥 ── 30日間の説得戦</div>

  <!-- Game screenshots -->
  <div class="screen-frame screen-left">
    <img src="${screens.daily}" />
    <div class="screen-label">学園生活パート</div>
  </div>
  <div class="screen-frame screen-right">
    <img src="${screens.battle}" />
    <div class="screen-label">説得バトル</div>
  </div>

  <!-- Character portraits -->
  <div class="portraits">
    <div class="portrait portrait-side">
      <img src="${portraits.takayama}" />
      <div class="portrait-name">
        <div class="faction-tag faction-conservative">保守派</div><br>鷹山誠一
      </div>
    </div>
    <div class="portrait portrait-center">
      <img src="${portraits.yuuki}" />
      <div class="portrait-name">
        <div class="faction-tag faction-progressive">革新派</div><br>結城あかり
      </div>
    </div>
    <div class="portrait portrait-side">
      <img src="${portraits.shido}" />
      <div class="portrait-name">
        <div class="faction-tag faction-sports">体育派</div><br>獅堂剛
      </div>
    </div>
  </div>
</body>
</html>
`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const outPath = path.resolve(__dirname, '../public/ogp.png');
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();

  console.log(`OGP image generated: ${outPath}`);
}

main().catch(console.error);
