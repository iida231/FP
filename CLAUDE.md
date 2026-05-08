# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**金利君 (Kinri-kun)** — A financial planning application focused on mortgage and loan calculations to support household budgeting.

GitHub: https://github.com/iida231/FP.git

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: SQLite via Prisma ORM

## Commands

Update these once the project is initialized:

```bash
npm run dev      # Start dev server (localhost:3000)
npx prisma db push   # Apply schema to SQLite
npx prisma studio    # Browse DB in browser
```

## Architecture

Tab-based SPA with three tabs: Loan Simulator, Household Diagnosis, Saved List.
- Loan calculations run on the client side (pure math, no server needed)
- Prisma API routes (`/api/simulations/*`) handle CRUD for saving/loading simulations
- The Household Diagnosis tab reads loan repayment data from the Loan Simulator tab's state

See `SPEC.md` for full feature specification and data model.
