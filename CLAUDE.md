# 生徒会長選挙ゲーム (seitokai-election)

学園生活シミュレーション × 説得バトルゲーム。
プレイヤーは学園の生徒として候補者を支持し、30日間で他の生徒を説得して選挙に勝つ。

## 技術スタック
- TypeScript strict mode（any禁止）
- Vite + DOM/CSS描画（Phaserは使わない）
- PC + スマホ両対応（Pointer Events使用）

## 開発コマンド
```bash
npm install          # 依存インストール
npx tsc --noEmit     # 型チェック
npx vite build       # ビルド
npx vite --port 5173 # 開発サーバー
```

## プロジェクト構成
```
src/
  main.ts               # エントリ
  game.ts               # 状態マシン（画面遷移管理）
  types.ts              # 型定義
  data.ts               # 生徒・候補者・場所データ
  battleLogic.ts        # 説得バトル判定ロジック
  data/
    organizations.ts    # 組織データ（クラス・部活）
  logic/
    organizationLogic.ts # 組織票計算ロジック
  screens/
    titleScreen.ts      # タイトル画面
    characterSelect.ts  # プレイヤーキャラ選択
    dailyScreen.ts      # 日常パート（メイン画面）
    battleScreen.ts     # 説得バトル
    debugScreen.ts      # デバッグ画面（F2）
    endingScreen.ts     # エンディング・ゲームオーバー
docs/
  game-spec.md          # ゲーム企画書
  student-params.md     # 生徒パラメータ仕様
  characters.md         # キャラクター設定・画像プロンプト
  glossary.md           # 用語集
  worldview.md          # 世界観・トーン設定（ログ文面のルール）
  design-guide.md       # UIデザインガイド（色・フォント・コンポーネント）
  portrait-config.md    # ComfyUI画像生成設定
portraits/              # キャラクターポートレート画像（Vite importで使用）
  raw/                  # 生成元の生画像（gitignore対象）
ai-sprites-local/       # ローカルComfyUIによる画像生成スクリプト
```

## ゲーム設計の要点
- 候補者も生徒もすべて `Student` 型で統一（`candidateId` フラグで区別）
- 組織（クラス・部活）の投票で選挙結果が決まる（個人票ではない）
- 組織タイプ: dictatorship / council / delegation / majority
- 説得バトル: 態度→話題→立場の3段階コマンド、バー綱引き（-100〜+100）
- 用語: 「人物」ではなく「生徒」を使う。派閥名は候補者名でなく「保守/革新/体育」

## 画像生成
- ローカルComfyUI（Illustrious-XL）でポートレート生成
- `.env.local` に `COMFYUI_PATH` を設定
- 生成スクリプト: `ai-sprites-local/generate_portrait.py`
- プロンプト設定: `docs/portrait-config.md`

## 重要なルール
- デプロイはユーザーの許可後にのみ行う
- 画像生成（有料API）は実行前にユーザー承認必須
- ドキュメントを新規作成・更新した場合は、必ずCLAUDE.mdのプロジェクト構成に追記してCLAUDE.mdから辿れるようにすること
