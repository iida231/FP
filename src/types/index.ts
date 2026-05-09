// ---- フォーム入力型 ----

export type ShortWorkPeriod = {
  startYear: number;
  endYear: number;
  ratio: number; // 0-1（例: 0.8 = 80%）
};

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
  mortgageDeductionMaxPerPerson?: number; // 控除上限（万円・一人当たり）
  mortgageDeductionClaimants?: number; // 控除申告人数（例: 1 または 2）
  mortgageDeductionLoanType?: 'joint' | 'pair'; // 連帯債務/収入合算=joint、ペアローン=pair
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
  // 時短勤務設定（複数期間）
  husbandShortWorkPeriods: ShortWorkPeriod[];
  wifeShortWorkPeriods: ShortWorkPeriod[];
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
  // 追加生活費（段階別・万円/月）
  extraMonthlyLivingCostNursing: number;
  extraMonthlyLivingCostElementary: number;
  extraMonthlyLivingCostMiddle: number;
  extraMonthlyLivingCostHigh: number;
  extraMonthlyLivingCostUniversity: number;
  // 習い事費（段階別・万円/月）
  monthlyExtracurricularNursing: number;
  monthlyExtracurricularElementary: number;
  monthlyExtracurricularMiddle: number;
  monthlyExtracurricularHigh: number;
  monthlyExtracurricularUniversity: number;
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

export type IncomeEventInput = {
  id: string;
  eventName: string; // 例: "退職金", "自宅売却"
  year: number;      // ローン開始からの年数
  amount: number;    // 万円
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
  incomeEvents: IncomeEventInput[]; // 退職金・物件売却など収入イベント
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
  totalBonusPayment: number; // ボーナス返済総額（円）
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
  householdTakeHome: number;   // 世帯手取り年収
  loanPayment: number;
  monthlyRegularPayment: number; // 月額通常返済（万円・ボーナス含まず）
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
  // DB互換: 旧フォーマットで保存された単一値（読み込み時に段階別フィールドへ展開）
  extraMonthlyLivingCost?: number;
  monthlyExtracurricular?: number;
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
  mortgageDeductionMaxPerPerson?: number;
  mortgageDeductionClaimants?: number;
};
