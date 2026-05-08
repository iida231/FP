---
issue: 15
title: "[Test] Playwright MCP の導入と E2E テストの実装"
state: open
---

## 概要

Playwright を MCP サーバーとして Claude Code に追加し、主要機能の E2E テストを実装する。

## タスク

- [ ] `.claude/settings.json` に Playwright MCP を追加
- [ ] E2Eテストシナリオの実装
  - Tab1: ローン入力・バリデーション・グラフ描画
  - Tab2: 家計診断フォーム入力・グラフ描画
  - Tab3: 保存・読み込み・削除操作
  - Tab3: 保存機能の不具合確認と修正
- [ ] テスト実行の確認
