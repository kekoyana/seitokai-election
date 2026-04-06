# ドキュメントインデックス

このディレクトリにはゲーム仕様・文体・デザイン・設定資料を置く。
詳細仕様を読むときは、このファイルを入口にして必要なドキュメントへ辿る。

## 役割分担

- `README.md`: プロジェクト概要、開発コマンド、ドキュメント入口
- `CLAUDE.md`: Claude 向けの作業ルールと参照先
- `AGENTS.md`: Codex 向けの作業ルールと参照先
- `GEMINI.md`: Gemini 向けの作業ルールと参照先
- `docs/*.md`: 実装・設定の一次仕様

## 優先して読むドキュメント

### 共通ルール
- `glossary.md`: 用語統一
- `worldview.md`: ログ文面、セリフ、トーン
- `design-guide.md`: UIデザイン、色、コンポーネント

### ゲーム仕様
- `game-spec.md`: ゲーム全体仕様、画面構成、説得バトル
- `activist-spec.md`: 活動家システム
- `exploration-events.md`: 探索イベント
- `student-params.md`: 生徒パラメータ、属性、好み

### 設定資料
- `characters.md`: キャラクター設定、画像プロンプト
- `compatibility-analysis.md`: 相性分析
- `portrait-config.md`: ポートレート生成設定

## 更新ルール

- 新しいドキュメントを追加したら、このファイルに追記する
- 構成変更があれば `README.md` と各 AI 向けガイドの参照先も更新する
- 実装ルールを変更した場合は、概要だけを `README.md` / 各 AI ガイドに書き、詳細は `docs/` 側へ集約する
