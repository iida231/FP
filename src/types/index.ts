// ---- フォーム入力型 ----

export type RatePeriodInput = {
  id: string;
  startYear: number;
  endYear: number;
  annualRate: number;
};

export type LoanInput = {
  loanAmount: number;
  termYears: number;
  repaymentType: "EQUAL_INSTALLMENT" | "EQUAL_PRINCIPAL";
  useFiveYearRule: boolean;
  use125PercentRule: boolean;
  ratePeriods: RatePeriodInput[];
  bonusRepaymentPerOccurrence: number; // ボーナス返済額（1回あたり万円）、年2回適用
};

export type IncomeInput = {
  husbandAnnualIncome: number;
  wifeAnnualIncome: number;
  husbandRaiseRate: number;
  wifeRaiseRate: number;
  monthlyLivingCost: number;
  husbandAge: number;
  wifeAge: number;
  husbandRetirementAge: number;
  wifeRetirementAge: number;
};

export type ChildInput = {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number; // 1-12
  nursing: "PUBLIC" | "PRIVATE";
  elementary: "PUBLIC" | "PRIVATE";
  middle: "PUBLIC" | "PRIVATE";
  high: "PUBLIC" | "PRIVATE";
  university: "NATIONAL" | "PRIVATE_HUMANITIES" | "PRIVATE_SCIENCE";
  husbandParentalLeaveMonths: number;
  wifeParentalLeaveMonths: number;
};

export type LifeEventInput = {
  id: string;
  eventName: string;
  year: number;
  amount: number;
};

export type HouseholdInput = {
  husbandCashAssets: number;       // 夫の現金資産（万円）
  husbandInvestmentAssets: number; // 夫の投資資産（万円）
  wifeCashAssets: number;          // 妻の現金資産（万円）
  wifeInvestmentAssets: number;    // 妻の投資資産（万円）
  monthlyInvestment: number;
  averageYield: number;
  children: ChildInput[];
  lifeEvents: LifeEventInput[];
};

// ---- 計算結果型 ----

export type MonthlyPaymentRow = {
  month: number;
  principal: number;
  interest: number;
  unpaidInterest: number;
  balance: number;
  payment: number;
  bonusPayment: number; // ボーナス返済額（円）
};

export type AnnualLoanSummary = {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalBonusPayment: number; // 年間ボーナス返済合計（円）
  balance: number;
};

export type LoanResult = {
  monthly: MonthlyPaymentRow[];
  annual: AnnualLoanSummary[];
  totalPayment: number;
  totalInterest: number;
};

export type AnnualCashFlow = {
  year: number;
  calendarYear: number;
  husbandAge: number;
  wifeAge: number;
  husbandIncome: number;
  wifeIncome: number;
  householdIncome: number;
  loanPayment: number;
  livingCost: number;
  remainder: number;
  husbandOnLeave: boolean;
  wifeOnLeave: boolean;
};

export type AnnualAssetRow = {
  year: number;
  totalAssets: number;
  cashAssets: number;
  investmentAssets: number;
  loanBalance: number;
  childrenCost: number;
  lifeEventCost: number;
};

// ---- API / 保存済み一覧型 ----

export type SimulationSummary = {
  id: number;
  name: string;
  loanAmount: number;
  termYears: number;
  totalPayment: number;
  createdAt: string;
};

export type HouseholdDetail = IncomeInput & {
  husbandCashAssets: number;
  husbandInvestmentAssets: number;
  wifeCashAssets: number;
  wifeInvestmentAssets: number;
  monthlyInvestment: number;
  averageYield: number;
  children: Omit<ChildInput, "id">[];
  lifeEvents: Omit<LifeEventInput, "id">[];
};

export type SimulationDetail = {
  id: number;
  name: string;
  loanAmount: number;
  termYears: number;
  repaymentType: "EQUAL_INSTALLMENT" | "EQUAL_PRINCIPAL";
  useFiveYearRule: boolean;
  use125PercentRule: boolean;
  totalPayment: number;
  createdAt: string;
  ratePeriods: Omit<RatePeriodInput, "id">[];
  household: HouseholdDetail | null;
  bonusRepaymentPerOccurrence: number;
};
