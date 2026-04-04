---
description: デザインガイド（docs/design-guide.md）に基づいてUI実装を検査し、違反箇所を報告する
---

docs/design-guide.md を読み込み、以下の観点で `src/` 内のコードを検査してください。
検査結果を一覧で報告し、違反があれば具体的なファイル名・行番号・修正案を提示してください。

## 検査項目

### 1. 禁止スタイルの検出（重要度: 高）

`src/screens/` 内のファイルを検索し、以下のパターンがないか確認:

- **ピル型ボタン**: `border-radius` が `50px` や `25px` などの大きな値（`50%` も含む）
- **グラスモーフィズム**: `backdrop-filter` の使用（`game.css` 以外で）
- **枠なしボタン**: `border: none` または `border:none`（ボタン要素に対して）
- **丸アイコン**: ポートレート画像に `border-radius: 50%` が使われていないか

### 2. 派閥色の一貫性（重要度: 高）

`src/screens/` 内で味方・支持を表す色として `#27AE60`（緑）がハードコードされていないか検索。

許容される `#27AE60` の用途（検査対象外）:
- 好感度の状態表示（「好意的」ラベル）
- 趣味の好き嫌い表示
- ステータスバーの色（知性等）

違反となる `#27AE60` の用途:
- `isAlly` 判定に連動した背景色・枠色
- 「支持中」バッジの色
- 組織一覧の味方ハイライト

### 3. CSS変数・クラスの活用（重要度: 中）

`src/screens/` 内で以下のハードコードがないか確認:

- **フォント指定**: `font-family` に `'Hiragino Kaku Gothic ProN'` や `'Meiryo'` が直接書かれている（`var(--game-font)` を使うべき）
- **背景グラデーション**: 日常画面系で `#E8F4FD` や `#FFF9E6` など旧カラーが残っていないか（`var(--game-bg-light)` / `var(--game-bg-warm)` を使うべき）
- **パネルの手書きスタイル**: `background:rgba(255,255,255,0.85); border-radius:14px; border:1px solid #e0eaf5` のような旧パネルスタイルが残っていないか（`.game-panel` クラスを使うべき）

### 4. ポートレート画像のスタイル（重要度: 中）

`src/screens/` 内でポートレート画像（`<img` タグで `.portrait` を参照しているもの）を検索し:

- `border-radius: 50%` が使われていないか → `4px` であるべき
- `object-fit: cover; object-position: top;` が設定されているか

### 5. ボタンのスタイル（重要度: 低）

新しく追加されたボタンが `.game-btn` クラスを使っているか。
インラインスタイルのみでボタンを定義している箇所がないか軽くチェック。
（既存コードのすべてを移行済みである必要はないが、明らかにゲーム風でないボタンがあれば報告）

## 出力フォーマット

```
## デザインチェック結果

### 違反あり
- [高] src/screens/dailyScreen.ts:123 - `border-radius:50px` のピル型ボタン → `border-radius:6px` + `.game-btn` に変更
- [高] src/screens/battleScreen.ts:456 - `isAlly` 判定で `#27AE60` を使用 → 派閥色 `sc?.color` に変更

### 注意（改善推奨）
- [中] src/screens/dailyScreen.ts:789 - パネルにインラインスタイル → `.game-panel` クラスの使用を推奨
- [低] src/screens/endingScreen.ts:100 - ボタンに `.game-btn` クラスが未適用

### 問題なし
- 禁止スタイル（グラスモーフィズム）: 検出なし
- ポートレート角丸: 全箇所 `4px` で統一済み
```

違反が0件の場合は「全項目問題なし」と報告してください。
