# 学園祭投票ゲーム (seitokai-election)

学園生活シミュレーション × 説得バトルゲーム。
プレイヤーは学園の生徒として派閥を支持し、30日間で他の生徒を説得して投票に勝つ。

## 技術スタック
- TypeScript strict mode（any禁止）
- Vite + DOM/CSS描画（Phaserは使わない）
- PC + スマホ両対応（Pointer Events使用）

## 最初に確認するファイル
- `README.md` # プロジェクト概要・開発コマンド
- `docs/README.md` # 仕様書インデックス
- 実装対象に対応する `docs/*.md`

## 開発コマンド
```bash
npm install              # 依存インストール
npx tsc --noEmit         # 型チェック
npx vite build           # ビルド（GitHub Pages用）
BUILD_TARGET=itch npx vite build  # ビルド（itch.io用、相対パス）
npx vite --port 5173     # 開発サーバー
npx tsx tools/simulate.ts # 説得バトルシミュレーション
```

## プロジェクト構成
```
README.md             # プロジェクト概要・開発ガイド
AGENTS.md             # Codex向け作業ガイド
GEMINI.md             # Gemini向け作業ガイド
src/
  main.ts               # エントリ
  game.ts               # 状態マシン（画面遷移管理）
  types.ts              # 型定義
  data.ts               # バレルファイル（各dataモジュールの再エクスポート）
  battleLogic.ts        # 説得バトル判定ロジック
  catchphrase.ts        # 性格別キャッチフレーズ（battleLogicから参照）
  data/
    students.ts         # 生徒データ・ポートレート・位置ロジック
    factions.ts         # 派閥情報（色・方針・ラベル）
    locations.ts        # 場所・フロア・移動コスト
    constants.ts        # 時間コスト定数
    labels.ts           # 各種ラベル・日付変換・性格アイコン色
    render.ts           # 支持バー・イニシャルアイコンHTML生成
    organizations.ts    # 組織データ（クラス・部活）
    conversationLines.ts # 会話テキストデータ
    eventLines.ts       # イベントセリフ（落とし物・おつかい、性格×性別対応）
  i18n/
    index.ts            # i18nコア（getLang/setLang/t/label）
    ja.ts / en.ts       # UI文字列辞書（日本語/英語）
    ja-data.ts / en-data.ts # データラベル辞書
    en-students.ts      # 英語生徒名・説明
    en-dialogue.ts      # 英語会話・バトルセリフ
    en-catchphrase.ts   # 英語キャッチフレーズ
  logic/
    activistLogic.ts     # 活動家（NPC説得）選出・行動ロジック
    organizationLogic.ts # 組織票計算ロジック
  ui/
    dom.ts              # DOM操作ヘルパー（$, on, onDataAttr）
    gameDialog.ts       # ダイアログUI（確認・情報）
  screens/
    Screen.ts           # 画面インターフェース（mount/unmount）
    titleScreen.ts      # タイトル画面
    factionSelect.ts    # 派閥選択画面
    characterSelect.ts  # プレイヤーキャラ選択（派閥固定）
    dailyScreen.ts      # 日常パート（メイン画面）
    daily/
      mapRenderer.ts    # マップ描画（フロア・部屋ボタン・階段）
      infoPanel.ts      # 情報パネル（クラス・部活・生徒一覧）
    battleScreen.ts     # 説得バトル
    debugScreen.ts      # デバッグ画面（F2）
    endingScreen.ts     # エンディング・ゲームオーバー
docs/
  README.md             # ドキュメント索引
  game-spec.md          # ゲーム企画書
  activist-spec.md      # 活動家（NPC説得）仕様
  student-params.md     # 生徒パラメータ仕様
  characters.md         # キャラクター設定・画像プロンプト
  glossary.md           # 用語集
  worldview.md          # 世界観・トーン設定（ログ文面のルール）
  design-guide.md       # UIデザインガイド（色・フォント・コンポーネント）
  portrait-config.md    # ComfyUI画像生成設定
  exploration-events.md # 探索イベント仕様（落とし物・情報収集・おつかい）
  i18n.md               # ローカライズ実装ガイド
  compatibility-analysis.md # 相性の非対称性分析（片思いペア一覧）
assets/
  portraits/            # キャラクターポートレート画像（Vite importで使用）
    raw/                # 生成元の生画像（gitignore対象）
  backgrounds/          # 背景画像
  bgm/                  # BGM
tools/
  simulate.ts           # 説得バトルシミュレーション（npx tsx tools/simulate.ts）
ai-sprites-local/       # ローカルComfyUIによる画像生成スクリプト（README.md参照）
```

## ゲーム設計の要点
- すべてのキャラクターが同一の `Student` 型
- 組織（クラス・部活）の投票で結果が決まる（個人票ではない）
- 組織タイプ: dictatorship / council / delegation / majority
- 説得バトル: 態度→話題→立場の3段階コマンド、バー綱引き（-100〜+100）
- 休憩: 保健室（60分/全回復）、自分の教室（30分/+40）、屋上（10分/+10）
- 用語: 「人物」ではなく「生徒」を使う。派閥名は「保守/革新/体育」

## 画像生成
- ローカルComfyUI（Illustrious-XL）でポートレート生成
- `.env.local` に `COMFYUI_PATH` を設定
- 生成スクリプト: `ai-sprites-local/generate_portrait.py`
- プロンプト設定: `docs/portrait-config.md`

## 重要なルール
- デプロイはユーザーの許可後にのみ行う
- 画像生成（有料API）は実行前にユーザー承認必須
- 実装前に `docs/README.md` から関連仕様を確認すること
- ドキュメントを新規作成・更新した場合は、必ず `docs/README.md` に追記し、必要に応じて `README.md` と各AI向けガイドから辿れるようにすること
