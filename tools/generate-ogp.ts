import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;

const titleBgPath = path.resolve(__dirname, '../assets/backgrounds/title.jpg');
const titleBgBase64 = fs.readFileSync(titleBgPath).toString('base64');
const titleBgDataUrl = `data:image/jpeg;base64,${titleBgBase64}`;

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
    background: url('${titleBgDataUrl}') center/cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Serif JP', serif;
    overflow: hidden;
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 20, 40, 0.45);
  }
  .content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;
  }
  .title {
    font-size: 96px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: 0.06em;
    text-shadow: 0 4px 20px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5);
    margin-bottom: 16px;
  }
  .subtitle {
    font-size: 36px;
    font-weight: 700;
    color: #e8d090;
    letter-spacing: 0.2em;
    text-shadow: 0 2px 10px rgba(0,0,0,0.6);
  }
</style>
</head>
<body>
  <div class="overlay"></div>
  <div class="content">
    <div class="title">Academy Tempest</div>
    <div class="subtitle">〜学園の風〜</div>
  </div>
</body>
</html>
`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  // Wait for font to load
  await page.waitForTimeout(2000);

  const outPath = path.resolve(__dirname, '../public/ogp.png');
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();

  console.log(`OGP image generated: ${outPath}`);
}

main().catch(console.error);
