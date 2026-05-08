# 金利君 仕様書 v0.2

## 概要

住宅ローンの返済シミュレーションと家計診断機能を持つWebアプリケーション。

- **対象ユーザー**: 住宅ローンを検討・返済中のユーザー（夫婦想定）
- **動作環境**: Webブラウザ（ローカル起動）
- **データ永続化**: SQLiteでシミュレーション結果を保存・再編集可能

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) + TypeScript |
| スタイル | Tailwind CSS |
| グラフ | Recharts |
| ORM / DB | Prisma + SQLite |
| 実行 | `npm run dev`（ローカル） |

---

## 画面構成（タブ切り替え型）

| タブ | 内容 |
|------|------|
| ローンシミュレーター | 借入設定・返済グラフ・キャッシュフロー |
| 家計診断 | 子供費用・資産・投資・ライフイベント |
| 保存済み一覧 | 過去のシミュレーション閲覧・編集・複製 |

---

## データモデル（Prismaスキーマ）

```prisma
model Simulation {
  id                Int           @id @default(autoincrement())
  name              String        // 保存名
  loanAmount        Float         // 借入金額（万円）
  termYears         Int           // 返済期間（年）
  repaymentType     RepaymentType
  useFiveYearRule   Boolean       @default(false)
  use125PercentRule Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  ratePeriods       RatePeriod[]
  household         Household?
}

model RatePeriod {
  id           Int        @id @default(autoincrement())
  simulationId Int
  simulation   Simulation @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  startYear    Int        // 開始年（返済開始を1年目とする）
  endYear      Int        // 終了年
  annualRate   Float      // 年利（%）
}

model Household {
  id                  Int         @id @default(autoincrement())
  simulationId        Int         @unique
  simulation          Simulation  @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  // 収入
  husbandAnnualIncome Float       // 夫の現在年収（万円）
  wifeAnnualIncome    Float       // 妻の現在年収（万円）
  husbandRaiseRate    Float       // 夫の平均昇給率（%/年）
  wifeRaiseRate       Float       // 妻の平均昇給率（%/年）
  // 支出
  monthlyLivingCost   Float       // 月々の生活費（万円、デフォルト20万円）
  // 資産・投資
  husbandAssets       Float       // 夫の現在資産（万円）
  wifeAssets          Float       // 妻の現在資産（万円）
  monthlyInvestment   Float       // 毎月の投資額（万円）
  averageYield        Float       // 平均利回り（%/年）
  children            Child[]
  lifeEvents          LifeEvent[]
}

model Child {
  id          Int         @id @default(autoincrement())
  householdId Int
  household   Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
  name        String      @default("子供")    // 任意の名前（例：長男、長女）
  birthYear   Int         // 返済開始からN年後に誕生（例：2 = 2年後）
  nursing     SchoolType  @default(PUBLIC)    // 保育園・幼稚園（0〜5歳）
  elementary  SchoolType  @default(PUBLIC)    // 小学校（6〜11歳）
  middle      SchoolType  @default(PUBLIC)    // 中学校（12〜14歳）
  high        SchoolType  @default(PUBLIC)    // 高校（15〜17歳）
  university  UnivType    @default(NATIONAL)  // 大学（18〜21歳）
}

model LifeEvent {
  id          Int       @id @default(autoincrement())
  householdId Int
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  eventName   String
  year        Int       // 発生年（返済開始からの経過年）
  amount      Float     // 費用（万円）
  isDefault   Boolean   @default(false)
}

enum RepaymentType {
  EQUAL_PRINCIPAL    // 元金均等返済
  EQUAL_INSTALLMENT  // 元利均等返済
}

enum SchoolType {
  PUBLIC   // 公立
  PRIVATE  // 私立
}

enum UnivType {
  NATIONAL          // 国立
  PRIVATE_HUMANITIES // 私立文系
  PRIVATE_SCIENCE   // 私立理系
}
```

---

## 機能詳細

### タブ1: ローンシミュレーター

#### セクション1-A: ローン入力

| 項目 | 入力形式 | 備考 |
|------|---------|------|
| 借入金額 | 数値入力（万円） | |
| 返済期間 | 数値入力（年） | |
| 返済方式 | トグルボタン | 元金均等 / 元利均等 |
| 5年ルール | チェックボックス | 元利均等選択時のみ有効 |
| 125%ルール | チェックボックス | 元利均等選択時のみ有効 |
| 金利期間設定 | テーブル形式（行追加・削除） | 開始年・終了年・年利（%） |

**金利期間テーブルの制約:**
- 全返済期間をカバーするように設定する
- 期間の重複・空白がある場合はバリデーションエラーを表示

#### セクション1-B: 収入・生活費入力（キャッシュフロー用）

| 項目 | 入力形式 | デフォルト |
|------|---------|----------|
| 夫の現在年収 | 数値入力（万円） | — |
| 夫の平均昇給率 | 数値入力（%/年） | 2% |
| 妻の現在年収 | 数値入力（万円） | — |
| 妻の平均昇給率 | 数値入力（%/年） | 2% |
| 月々の生活費 | 数値入力（万円） | 20万円 |

**生活費の内訳（参考・初期値の根拠）**

デフォルト20万円/月の内訳（変更は合計値のみ）：

| 費目 | 目安 |
|------|------|
| 食費 | 6.5万円 |
| 光熱費・通信費 | 3.5万円 |
| 交通費 | 1.5万円 |
| 衣類・日用品 | 2万円 |
| 医療・保険 | 3万円 |
| 娯楽・交際費 | 2.5万円 |
| その他 | 1万円 |
| **合計** | **20万円** |

（子供費用・ローン返済額は別途計算）

#### セクション1-C: ローン返済グラフ

1. 月次返済額の推移（折れ線グラフ）— 金利変更タイミングを縦線で表示
2. 月次の元金・利息内訳（積み上げ棒グラフ、年単位で集計）

**概要カード（グラフ下）:**
- 総返済額 / 総利息額 / 元金比率
- ドーナツグラフ（元金 vs 利息）

#### セクション1-D: キャッシュフロー一覧（年次グラフ）

収入・返済・生活費・手残りを1本のグラフで表示。全てローン期間と同軸（年単位）。

| 系列 | 計算式 |
|------|--------|
| 夫の年収 | 初年度年収 × (1 + 昇給率)^(N-1) |
| 妻の年収 | 同上 |
| 世帯年収合計 | 夫 + 妻 |
| 年間ローン返済額 | 月返済額 × 12（ローン計算から取得） |
| 年間生活費 | 月々の生活費 × 12 |
| 手残り（年） | 世帯年収 - ローン返済 - 生活費 |

- 手残りがマイナスになる年をグラフ上に強調表示（赤背景など）

#### 計算ロジック

**元利均等返済:**
```
月利 r = 年利 / 12
月返済額 = P × r(1+r)^n / ((1+r)^n - 1)
（P=借入金額、n=返済月数）
```

**元金均等返済:**
```
毎月の元金 = P / n
毎月の利息 = 残高 × r
毎月の返済額 = 元金 + 利息
```

**5年ルール（元利均等時）:**
- 金利が変動しても5年間は月返済額を固定
- 固定期間中の未払い利息を追跡し、グラフに「未払い利息」として表示

**125%ルール（元利均等時）:**
- 5年ごとの見直し時、新返済額 ≤ 前回返済額 × 1.25 を上限とする
- 差額は次回見直し時に繰り越す

---

### タブ2: 家計診断

#### セクション2-A: 子供の費用シミュレーション（子供ごとに設定）

**子供の追加:**
- 「＋子供を追加」ボタンで複数人設定可（人数制限なし）
- 各子供に名前（任意）・誕生年（返済開始からN年後）を設定

**各子供の学校区分選択（段階ごと）:**

| 段階 | 年齢 | 選択肢 |
|------|------|--------|
| 保育園・幼稚園 | 0〜5歳 | 公立 / 私立 |
| 小学校 | 6〜11歳 | 公立 / 私立 |
| 中学校 | 12〜14歳 | 公立 / 私立 |
| 高校 | 15〜17歳 | 公立 / 私立 |
| 大学 | 18〜21歳 | 国立 / 私立文系 / 私立理系 |

**教育費デフォルト値（文部科学省データ基準、変更可）:**

| 段階 | 公立（万円/年） | 私立（万円/年） |
|------|-------------|-------------|
| 保育園・幼稚園 | 19 | 40 |
| 小学校 | 5 | 167 |
| 中学校 | 49 | 143 |
| 高校 | 51 | 105 |
| 大学（国立） | 82 | — |
| 大学（私立文系） | — | 115 |
| 大学（私立理系） | — | 154 |

**子供費用グラフ（横棒 or 積み上げ棒グラフ）:**
- X軸: 返済開始からの年数
- 各子供の費用を色分けして重ねて表示
- 棒の上に子供の年齢をラベル表示（例：「長男 6歳（小1）」）

#### セクション2-B: 資産・投資入力

| 項目 | 入力形式 |
|------|---------|
| 夫の現在資産 | 数値入力（万円） |
| 妻の現在資産 | 数値入力（万円） |
| 毎月の投資額 | 数値入力（万円） |
| 平均利回り | 数値入力（%/年） |

#### セクション2-C: ライフイベント（子供費用以外）

**デフォルトイベント**（年・金額・名前はすべて変更可、削除可）:

| イベント名 | デフォルト金額 |
|---------|-------------|
| 車の購入 | 300万円 |
| 住宅リフォーム | 200万円 |
| 家電の買い替え | 50万円 |

- 行を自由に追加・削除
- 各行：イベント名、発生年（返済開始からの経過年）、金額（万円）

#### セクション2-D: 資産推移グラフ（折れ線グラフ、年単位）

以下を1つのグラフに重ねて表示:

| 系列 | 内容 |
|------|------|
| 資産残高 | 現在資産合計 + 投資複利成長 - 子供費用 - ライフイベント支出 |
| ローン残債 | ローンタブから取得（逆方向、参考） |
| ライフイベント | 発生年に縦線マーカー + ラベル |
| 子供のイベント | 入学年に縦線マーカー（段階名・年齢を表示） |

**複利計算:**
```
年末資産 = 年初資産 × (1 + 利回り/100) + 年間投資額 - 子供費用合計 - ライフイベント費用
```

---

### タブ3: 保存済み一覧

- 保存したシミュレーションをカード形式で一覧表示（新しい順）
- カードに表示: 保存名・借入金額・返済期間・総返済額・保存日時
- 操作: **閲覧**（ローンタブで読み込む）・**複製**・**削除**
- シミュレーション名のインライン編集

---

## API設計（Next.js API Routes）

| エンドポイント | メソッド | 内容 |
|--------------|---------|------|
| `/api/simulations` | GET | 一覧取得 |
| `/api/simulations` | POST | 新規保存（household・children・lifeEventsを含む） |
| `/api/simulations/[id]` | GET | 詳細取得 |
| `/api/simulations/[id]` | PUT | 更新 |
| `/api/simulations/[id]` | DELETE | 削除 |

---

## 今後検討する項目

- 繰り上げ返済シミュレーション（期間短縮型・返済額軽減型）
- PDF・CSV出力機能
- 複数ローン（フラット35 + 変動金利の組み合わせ）
- スマートフォン対応レイアウト
