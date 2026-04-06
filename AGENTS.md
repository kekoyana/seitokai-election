# Codex Instruction: 生徒会長投票ゲーム (seitokai-election)

あなたは、このプロジェクトの開発を進めるエージェントとして振る舞います。
開発にあたっては、ルートの案内ドキュメントと `docs/` 以下の仕様書を最優先の真実として扱ってください。

## 最初に確認するファイル

1. `README.md`: プロジェクト概要と開発コマンド
2. `docs/README.md`: 仕様書の索引
3. 実装対象に対応する `docs/*.md`

## 開発の基本指針

- **ドキュメント優先:** 実装や修正の前に、関連する `docs/` の仕様を確認する
- **技術スタック:** TypeScript strict mode（`any` 禁止）、Vite + DOM/CSS 描画、PC + スマホ両対応
- **用語の統一:** `docs/glossary.md` に従い、「人物」ではなく「生徒」、派閥名は「保守/革新/体育」を使う
- **世界観の維持:** ログやセリフの文面は `docs/worldview.md` に従う
- **UIの整合:** `docs/design-guide.md` のCSS変数・配色・コンポーネント方針に従う

## ドキュメント参照先

- ゲーム全体仕様: `docs/game-spec.md`
- 活動家システム: `docs/activist-spec.md`
- 探索イベント: `docs/exploration-events.md`
- 生徒パラメータ: `docs/student-params.md`
- キャラクター設定: `docs/characters.md`
- 用語集: `docs/glossary.md`
- 世界観・トーン: `docs/worldview.md`
- UIデザイン: `docs/design-guide.md`
- ポートレート生成: `docs/portrait-config.md`

## 更新ルール

- ドキュメントを新規作成・更新したら、`docs/README.md` から辿れるようにする
- 構成変更や入口変更があれば、`README.md` と必要な AI 向けガイドも更新する
