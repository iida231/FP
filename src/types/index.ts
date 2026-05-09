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
  mortgageDeductionRate: number;   // 住宅ローン控除率（%）
  mortgageDeductionYears: number;  // 控除期間（年）
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
  husbandSummerBonusMonths: number; // 夏ボーナス月数
  husbandWinterBonusMonths: number; // 冬ボーナス月数
  wifeSummerBonusMonths: number;
  wifeWinterBonusMonths: number;
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
  extraMonthlyLivingCost: number; // 追加月間生活費（万円）
  monthlyExtracurricular: number; // 月間習い事費（万円）
  customNursingCost: number;
  customElementaryCost: number;
  customMiddleCost: number;
  customHighCost: number;
  customUniversityCost: number;
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
  householdBaseIncome: number; // ボーナスを除いた世帯収入
  loanPayment: number;
  livingCost: number;
  childrenCost: number; // 教育費＋追加生活費＋習い事
  mortgageDeduction: number; // 住宅ローン控除額（万円/年）
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

export type HouseholdChildDetail = Omit<ChildInput, "id"> & {
  customNursingCost?: number;
  customElementaryCost?: number;
  customMiddleCost?: number;
  customHighCost?: number;
  customUniversityCost?: number;
};

export type HouseholdDetail = IncomeInput & {
  husbandCashAssets: number;
  husbandInvestmentAssets: number;
  wifeCashAssets: number;
  wifeInvestmentAssets: number;
  monthlyInvestment: number;
  averageYield: number;
  children: HouseholdChildDetail[];
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
  mortgageDeductionRate: number;
  mortgageDeductionYears: number;
};
