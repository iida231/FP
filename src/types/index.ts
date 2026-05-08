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
};

export type IncomeInput = {
  husbandAnnualIncome: number;
  wifeAnnualIncome: number;
  husbandRaiseRate: number;
  wifeRaiseRate: number;
  monthlyLivingCost: number;
};

export type ChildInput = {
  id: string;
  name: string;
  birthYear: number;
  nursing: "PUBLIC" | "PRIVATE";
  elementary: "PUBLIC" | "PRIVATE";
  middle: "PUBLIC" | "PRIVATE";
  high: "PUBLIC" | "PRIVATE";
  university: "NATIONAL" | "PRIVATE_HUMANITIES" | "PRIVATE_SCIENCE";
};

export type LifeEventInput = {
  id: string;
  eventName: string;
  year: number;
  amount: number;
};

export type HouseholdInput = {
  husbandAssets: number;
  wifeAssets: number;
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
};

export type AnnualLoanSummary = {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
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
  husbandIncome: number;
  wifeIncome: number;
  householdIncome: number;
  loanPayment: number;
  livingCost: number;
  remainder: number;
};

export type AnnualAssetRow = {
  year: number;
  assets: number;
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
  husbandAssets: number;
  wifeAssets: number;
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
};
