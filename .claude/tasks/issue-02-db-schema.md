---
issue: 2
title: "[DB] Prismaスキーマの定義"
state: open
---

## 概要

SPEC.md のデータモデルに基づいて Prisma スキーマを作成し、SQLite に反映する。

## タスク

- [ ] `schema.prisma` にモデルを定義
  - Simulation
  - RatePeriod
  - Household
  - Child
  - LifeEvent
- [ ] Enum を定義（RepaymentType, SchoolType, UnivType）
- [ ] `npx prisma db push` でマイグレーション実行
- [ ] `npx prisma studio` でデータ構造を確認
