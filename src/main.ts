import { Game } from './game';
import './game.css';

// Canvas要素は非表示にする（このゲームはDOM/CSS UIを使用）
const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.style.display = 'none';

// ゲームのルートコンテナを作成
const root = document.createElement('div');
root.id = 'game-root';
root.style.cssText = 'position:fixed; inset:0; overflow:hidden;';
document.body.appendChild(root);

// ゲーム起動
new Game(root);
