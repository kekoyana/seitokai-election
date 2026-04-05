# デザインガイド

## コンセプト

ときメモ/パワプロ風の学園ゲームUI。
明るく爽やかな学園の雰囲気を保ちつつ、「ゲームのウィンドウ」としての存在感を持たせる。

### やること
- 白背景 + 太い色枠のパネル（ゲームウィンドウ感）
- 立体感のあるボタン（グラデーション + ベベル + 押し込み）
- 丸ゴシック系フォント（柔らかさ）
- 明るい配色ベース（学園の日常感）

### やらないこと
- Webアプリ的なグラスモーフィズム（`backdrop-filter: blur`）
- ピル型ボタン（`border-radius: 50px`）
- フラットデザイン（影・枠なしのボタン）
- ダークテーマ全面適用（バトル画面は例外）

## カラーシステム

### CSS変数（`src/game.css` の `:root` で定義）

| 変数名 | 値 | 用途 |
|--------|------|------|
| `--game-bg-light` | `#d8eaf8` | 画面背景（水色側） |
| `--game-bg-warm` | `#f5efe0` | 画面背景（暖色側） |
| `--game-panel-bg` | `rgba(255,255,255,0.95)` | パネル背景 |
| `--game-panel-border` | `#3868a8` | パネル枠（メイン） |
| `--game-panel-border-light` | `#70a0d8` | パネル枠（軽め） |
| `--game-panel-highlight` | `#f08030` | ホバー時のハイライト |
| `--game-panel-inner` | `#e8f0f8` | パネル内の背景（説明文等） |
| `--game-heading` | `#1a3060` | 見出し文字色 |
| `--game-heading-accent` | `#d04020` | 見出しアクセント（赤） |
| `--game-text` | `#2a3040` | 通常テキスト |
| `--game-text-dim` | `#6878a0` | 補助テキスト |
| `--game-accent` | `#2878c8` | アクセントカラー |

### 派閥色（`src/data.ts` の `CANDIDATE_INFO` で定義）

| 派閥 | color | accentColor |
|------|-------|-------------|
| 保守派 | `#1B3A6B`（濃紺） | `#2E5FAC`（青） |
| 革新派 | `#C45A00`（橙） | `#E07820`（明るい橙） |
| 体育派 | `#A00000`（赤） | `#D02020`（明るい赤） |

#### 派閥色の使い方ルール
- 「味方」「支持中」を表す色は**固定色（緑など）ではなく、その派閥のイメージカラー**を使う
- 派閥バッジ、支持表示、組織のハイライト等はすべて `CANDIDATES` の `color` を参照する
- 新しい派閥が追加された場合も `CANDIDATE_INFO` に定義すれば自動的に反映される設計にする

### 効果色（ログ内テキスト用。詳細は `docs/worldview.md` を参照）

| 種類 | 色 | 用途 |
|------|------|------|
| ポジティブ | `#7EC850` | 好感度UP、体力回復、趣味が好き |
| ネガティブ | `#F07070` | 好感度DOWN、趣味が嫌い |
| 中立 | `#999` | 趣味が普通、変化なし |

これらは派閥色とは無関係な「効果の種類」を示す色。混同しないこと。

### 意味的なUI色（好感度表示など）

| 状態 | 色 | 備考 |
|------|------|------|
| 好意的（好感度高） | `#27AE60` | UI上のラベル色。ログの効果色とは別 |
| 不快（好感度低） | `#C0392B` | 同上 |
| 普通 | `#888` | 同上 |

## フォント

```
--game-font: 'M PLUS Rounded 1c', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
```

- Google Fontsから `M PLUS Rounded 1c`（ウェイト: 400, 700, 900）を読み込み
- 見出し: `font-weight: 900` または `700`
- 本文: `font-weight: 400`
- すべてのボタン・入力欄に `font-family: var(--game-font)` を指定すること

## コンポーネント

### パネル（ウィンドウ）

| クラス | 用途 | 特徴 |
|--------|------|------|
| `.game-panel` | メインパネル | 白背景、青太枠(3px)、角丸8px |
| `.game-panel-light` | 補助パネル | 半透明白、青細枠(2px)、角丸6px |
| `.game-panel-dark` | バトル画面専用 | ダーク背景、青枠(3px) |

```html
<!-- 基本パネル -->
<div class="game-panel">内容</div>

<!-- 補助パネル（派閥説明など） -->
<div class="game-panel-light">内容</div>
```

### ボタン

| クラス | 色 | 用途 |
|--------|------|------|
| `.game-btn-primary` | 青 | メインアクション（移動、会話） |
| `.game-btn-danger` | 赤 | 危険な操作 |
| `.game-btn-success` | 緑 | 肯定、成功 |
| `.game-btn-warning` | 橙 | 説得、翌日へ |
| `.game-btn-disabled` | グレー | 操作不可 |
| `.game-btn-etrian` | 青/金 | **タイトル画面・主要メニュー用装飾ボタン** |

#### 標準装飾ボタン (`.game-btn`)
ゲーム中の主要アクションに使用。世界樹風のエッセンスを軽量化して適用。
- **デザイン**: 左端に属性色の太線、右端に細い垂直スリット（装飾ライン）を持つ。
- **ホバー**: **右に5pxスライド**し、彩度・輝度がアップ（発光感）。
- **目的**: 頻繁な操作でも疲れず、かつ「ゲームを操作している」ワクワク感を与える。

#### 重厚装飾ボタン (`.game-btn-etrian`)
タイトル画面などの「大きな選択」に使用する、最も豪華なスタイル。
- **通常時**: 深い青のグラデーション、右端の半円チップ装飾。
- **ホバー時**: **鮮やかな金色**に変化し、右側に10pxスライド。
- **目的**: プレイヤーをゲームの世界観に引き込む「入り口」としての重厚感。

```html
<!-- 標準ボタン -->
<button class="game-btn game-btn-primary">会話</button>

<!-- タイトル用ボタン -->
<button class="game-btn-etrian">ゲームスタート</button>
```

ボタンの特徴:
- `border-radius: 4px`（精密感を出すため以前より少し角を立たせる）
- **スライドエフェクト**: `:hover` で `translateX` を使用
- **発光エフェクト**: `:hover` で `filter: brightness(1.1)` を使用

### ダイアログ（`src/ui/gameDialog.ts`）

ゲーム内で確認やお知らせを表示するモーダルダイアログ。
browser の `confirm()` / `alert()` は使わず、必ずこのコンポーネントを使う。

#### 種類

| 関数 | 用途 | 戻り値 |
|------|------|--------|
| `showConfirmDialog(parent, options)` | ユーザーに Yes/No を問う | `Promise<boolean>` |
| `showInfoDialog(parent, options)` | 情報を伝えてOKで閉じる | `Promise<void>` |

#### 使用ルール

- **翌日確認** → `showConfirmDialog`（okStyle: `'warning'`）
- **組織の支持変動通知** → `showInfoDialog`（title: `'支持変動'`）
- **全組織統一メッセージ** → `showInfoDialog`（title: `'思想統一'`）
- **その他のお知らせ** → `showInfoDialog`
- 独自のオーバーレイ (`position:fixed; inset:0`) を手書きしない。必ずダイアログ関数を使うこと

#### デザイン仕様

- **タイトルバー**: 青グラデーション（`#4898e0` → `#2868b0`）、白文字、パワプロ風
- **本体**: `.game-panel-bg` 背景、`--game-panel-border` 枠（3px）、角丸8px
- **ボタン**: `.game-btn` + `.game-btn-{style}`、`font-family: var(--game-font)`
- **オーバーレイ**: `rgba(0,0,20,0.4)` 半透明背景、`position:absolute; inset:0; z-index:200`
- **アニメーション**: `game-slide-up 0.2s ease`（ボックス）、`fadeIn 0.2s ease`（オーバーレイ）
- **重複防止**: オーバーレイに `.game-dialog-overlay` クラスを付与。表示前に `querySelector('.game-dialog-overlay')` で既存ダイアログを検出可能

#### オプション

```typescript
// 確認ダイアログ
showConfirmDialog(parent, {
  title?: string,       // デフォルト: '確認'
  message: string,      // 本文（HTMLも可）
  okLabel?: string,     // デフォルト: 'OK'
  cancelLabel?: string, // デフォルト: 'やめる'
  okStyle?: 'primary' | 'danger' | 'warning' | 'success',
});

// インフォメーションダイアログ
showInfoDialog(parent, {
  title?: string,       // デフォルト: 'お知らせ'
  message: string,      // 本文（HTMLも可）
  okLabel?: string,     // デフォルト: 'OK'
  okStyle?: 'primary' | 'danger' | 'warning' | 'success',
});
```

### HUDバッジ

| クラス | 用途 |
|--------|------|
| `.game-hud-badge` | 日常画面のHUD（白背景） |
| `.game-hud-badge-dark` | バトル画面のHUD（ダーク背景） |

### キャラカード

`.game-chara-card` — 生徒一覧で使うカード。ホバーでオレンジハイライト。

### プログレスバー

`.game-bar` + `.game-bar-fill` — ステータスバー、説得バーなど。

## 画面別テーマ

| 画面 | 背景 | パネル | HUD |
|------|------|--------|-----|
| タイトル | 背景画像 | `.game-panel` | なし |
| キャラ選択 | ダーク半透明オーバーレイ（キャラを際立たせる） | インラインダーク | なし |
| 日常 | 明るいグラデ | `.game-panel`, `.game-chara-card` | `.game-hud-badge` |
| バトル | ダークグラデ(`#1a2840`〜`#283850`) | インラインダーク | `.game-hud-badge-dark` |
| エンディング | 明るいグラデ | `.game-panel` | なし |

バトル画面・キャラ選択画面がダークテーマ。バトルは緊張感、キャラ選択はポートレートを際立たせる演出として意図的に分けている。

## ポートレート画像

| 箇所 | サイズ | 角丸 | 枠線 |
|------|--------|------|------|
| キャラ選択（メイン） | 180x180px | `8px` | `3px solid 派閥色` + グロー |
| キャラ選択（サムネイル） | 48x48px | `4px` | `2px solid 派閥色` |
| 日常画面カード | 48x48px | `4px` | `2px solid #b0c0d8` or 派閥色 |
| バトル画面 | 96x96px | `4px` | `2px solid var(--game-panel-border)` |
| HUDアイコン | 28x28px | `3px` | `1px solid rgba(255,255,255,0.5)` |

共通: `object-fit: cover; object-position: top;`

## やってはいけないこと

- `border-radius: 50%`（丸アイコン）の使用 → `4px` の角丸に統一
- `backdrop-filter: blur()` の使用 → 不透明パネルで代替
- `border-radius: 50px` のピル型ボタン → `.game-btn`（6px）を使う
- 派閥の味方表示に `#27AE60`（緑）を固定で使う → 派閥色を動的に参照
- ボタンに `border: none` → 必ず枠線をつけて立体感を出す
- `font-family: inherit` のみでフォント未指定 → `var(--game-font)` を明示
��使う → 派閥色を動的に参照
- ボタンに `border: none` → 必ず枠線をつけて立体感を出す
- `font-family: inherit` のみでフォント未指定 → `var(--game-font)` を明示
