import type {
  LoanInput,
  IncomeInput,
  HouseholdInput,
  ChildInput,
  LoanResult,
  MonthlyPaymentRow,
  AnnualLoanSummary,
  AnnualCashFlow,
  AnnualAssetRow,
  RatePeriodInput,
  LifeEventInput,
  IncomeEventInput,
} from "@/types";
import { getAnnualEducationCost, getAnnualEducationCostCustom } from "./educationCosts";

// 子どもの年齢に応じた段階別追加費用（追加生活費 + 習い事費）を返す
export function getExtraMonthlyForAge(child: ChildInput, age: number): number {
  if (age < 0 || age > 21) return 0;
  if (age <= 5)  return (child.extraMonthlyLivingCostNursing    ?? 0) + (child.monthlyExtracurricularNursing    ?? 0);
  if (age <= 11) return (child.extraMonthlyLivingCostElementary ?? 0) + (child.monthlyExtracurricularElementary ?? 0);
  if (age <= 14) return (child.extraMonthlyLivingCostMiddle     ?? 0) + (child.monthlyExtracurricularMiddle     ?? 0);
  if (age <= 17) return (child.extraMonthlyLivingCostHigh       ?? 0) + (child.monthlyExtracurricularHigh       ?? 0);
  return (child.extraMonthlyLivingCostUniversity ?? 0) + (child.monthlyExtracurricularUniversity ?? 0);
}

// 各月に適用する年利(%)を返すヘルパー
function getRateForMonth(month: number, ratePeriods: RatePeriodInput[]): number {
  const year = Math.ceil(month / 12);
  for (const period of ratePeriods) {
    if (year >= period.startYear && year <= period.endYear) {
      return period.annualRate;
    }
  }
  return ratePeriods[ratePeriods.length - 1].annualRate;
}

// 育休期間中の収入割合を計算（日本の育児休業給付金制度）
// 最初6ヶ月=67%、以降=50%。複数の子どもで重なる場合は最も低い割合を適用
function getAnnualLeaveIncomeFactor(
  leaves: { birthYear: number; birthMonth: number; leaveMonths: number }[],
  calendarYear: number
): number {
  let annualTotal = 0;
  for (let m = 1; m <= 12; m++) {
    let minFactor = 1.0;
    for (const { birthYear, birthMonth, leaveMonths } of leaves) {
      if (leaveMonths === 0) continue;
      const monthsIntoLeave = (calendarYear - birthYear) * 12 + m - birthMonth;
      if (monthsIntoLeave >= 0 && monthsIntoLeave < leaveMonths) {
        const factor = monthsIntoLeave < 6 ? 0.67 : 0.50;
        minFactor = Math.min(minFactor, factor);
      }
    }
    annualTotal += minFactor;
  }
  return annualTotal / 12;
}

// 年収から手取り率を推定（簡易計算）
export function getTakeHomeRate(annualIncome: number): number {
  if (annualIncome <= 200) return 0.80;
  if (annualIncome <= 400) return 0.78;
  if (annualIncome <= 600) return 0.75;
  if (annualIncome <= 800) return 0.72;
  if (annualIncome <= 1000) return 0.68;
  return 0.65;
}

export function calculateLoan(input: LoanInput): LoanResult {
  const {
    loanAmount,
    termYears,
    repaymentType,
    useFiveYearRule,
    use125PercentRule,
    ratePeriods,
    bonusRepaymentPerOccurrence,
  } = input;
  const P = loanAmount * 10000; // 万円 → 円
  const n = termYears * 12;

  const monthlyRows: MonthlyPaymentRow[] = [];
  let balance = P;
  let fixedPayment = 0;
  let prevFixedPayment = 0;
  let unpaidInterestAccum = 0;

  for (let month = 1; month <= n; month++) {
    if (balance <= 0) {
      // 繰り上げ返済で完済済み
      monthlyRows.push({
        month,
        principal: 0,
        interest: 0,
        unpaidInterest: 0,
        balance: 0,
        payment: 0,
        bonusPayment: 0,
      });
      continue;
    }

    const annualRate = getRateForMonth(month, ratePeriods);
    const r = annualRate / 100 / 12;

    if (useFiveYearRule && (month === 1 || month % 60 === 1)) {
      const remainingMonths = n - month + 1;
      let newPayment: number;
      if (r === 0) {
        newPayment = balance / remainingMonths;
      } else {
        newPayment =
          (balance * (r * Math.pow(1 + r, remainingMonths))) /
          (Math.pow(1 + r, remainingMonths) - 1);
      }
      if (use125PercentRule && prevFixedPayment > 0) {
        newPayment = Math.min(newPayment, prevFixedPayment * 1.25);
      }
      prevFixedPayment = fixedPayment || newPayment;
      fixedPayment = newPayment;
    }

    let payment: number;
    let principalPart: number;
    let interestPart: number;

    if (repaymentType === "EQUAL_INSTALLMENT") {
      let unpaidThisMonth = 0;
      if (useFiveYearRule) {
        interestPart = balance * r;
        if (fixedPayment >= interestPart) {
          principalPart = fixedPayment - interestPart;
          payment = fixedPayment;
        } else {
          unpaidThisMonth = interestPart - fixedPayment;
          unpaidInterestAccum += unpaidThisMonth;
          principalPart = 0;
          payment = fixedPayment;
        }
      } else {
        if (r === 0) {
          payment = P / n;
          principalPart = payment;
          interestPart = 0;
        } else {
          const remainingMonths = n - month + 1;
          payment =
            (balance * (r * Math.pow(1 + r, remainingMonths))) /
            (Math.pow(1 + r, remainingMonths) - 1);
          interestPart = balance * r;
          principalPart = payment - interestPart;
        }
      }
    } else {
      // 元金均等
      const principalFixed = P / n;
      interestPart = balance * r;
      principalPart = principalFixed;
      payment = principalPart + interestPart;
    }

    balance = Math.max(0, balance - principalPart);

    // ボーナス返済: 6ヶ月ごと（月6・12・18…）に元本から差し引く
    let bonusPayment = 0;
    if (bonusRepaymentPerOccurrence > 0 && month % 6 === 0 && balance > 0) {
      bonusPayment = Math.min(bonusRepaymentPerOccurrence * 10000, balance);
      balance -= bonusPayment;
    }

    monthlyRows.push({
      month,
      principal: Math.round(principalPart),
      interest: Math.round(interestPart),
      unpaidInterest: Math.round(unpaidInterestAccum),
      balance: Math.round(balance),
      payment: Math.round(payment),
      bonusPayment: Math.round(bonusPayment),
    });
  }

  // 年次集計
  const annual: AnnualLoanSummary[] = [];
  for (let year = 1; year <= termYears; year++) {
    const yearRows = monthlyRows.filter(
      (row) => row.month >= (year - 1) * 12 + 1 && row.month <= year * 12
    );
    annual.push({
      year,
      totalPayment: yearRows.reduce((s, row) => s + row.payment, 0),
      totalPrincipal: yearRows.reduce((s, row) => s + row.principal, 0),
      totalInterest: yearRows.reduce((s, row) => s + row.interest, 0),
      totalBonusPayment: yearRows.reduce((s, row) => s + row.bonusPayment, 0),
      balance: yearRows[yearRows.length - 1]?.balance ?? 0,
    });
  }

  const totalPayment =
    monthlyRows.reduce((s, row) => s + row.payment + row.bonusPayment, 0);
  const totalInterest = monthlyRows.reduce((s, row) => s + row.interest, 0);
  const totalBonusPayment = monthlyRows.reduce((s, row) => s + row.bonusPayment, 0);

  return { monthly: monthlyRows, annual, totalPayment, totalInterest, totalBonusPayment };
}

export function calculateCashFlow(
  loanResult: LoanResult,
  incomeInput: IncomeInput,
  children: ChildInput[] = [],
  mortgageDeductionRate = 0,
  mortgageDeductionYears = 0,
  mortgageDeductionMaxPerPerson = 0,
  mortgageDeductionClaimants = 1,
  mortgageDeductionLoanType: 'joint' | 'pair' = 'joint',
  lifeEvents: LifeEventInput[] = [],
  incomeEvents: IncomeEventInput[] = [],
): AnnualCashFlow[] {
  const currentYear = new Date().getFullYear();
  const {
    husbandAnnualIncome,
    wifeAnnualIncome,
    husbandRaiseRate,
    wifeRaiseRate,
    monthlyLivingCost,
    husbandAge,
    wifeAge,
    husbandRetirementAge,
    wifeRetirementAge,
    husbandSummerBonusMonths = 0,
    husbandWinterBonusMonths = 0,
    wifeSummerBonusMonths = 0,
    wifeWinterBonusMonths = 0,
    husbandShortWorkPeriods = [],
    wifeShortWorkPeriods = [],
  } = incomeInput;

  const husbandBonusMonths = husbandSummerBonusMonths + husbandWinterBonusMonths;
  const wifeBonusMonths = wifeSummerBonusMonths + wifeWinterBonusMonths;

  // 月収 = 総年収 ÷ (12 + ボーナス月数)
  const husbandMonthlyBase = husbandAnnualIncome / (12 + husbandBonusMonths);
  const wifeMonthlyBase = wifeAnnualIncome / (12 + wifeBonusMonths);

  const husbandRetireCalYear = currentYear + (husbandRetirementAge - husbandAge);
  const wifeRetireCalYear = currentYear + (wifeRetirementAge - wifeAge);

  return loanResult.annual.map((ann, i) => {
    const year = i + 1;
    const calendarYear = currentYear + year;
    const hAge = husbandAge + year;
    const wAge = wifeAge + year;

    const husbandLeaveFactor = getAnnualLeaveIncomeFactor(
      children.map((c) => ({
        birthYear: c.birthYear,
        birthMonth: c.birthMonth,
        leaveMonths: c.husbandParentalLeaveMonths,
      })),
      calendarYear
    );
    const wifeLeaveFactor = getAnnualLeaveIncomeFactor(
      children.map((c) => ({
        birthYear: c.birthYear,
        birthMonth: c.birthMonth,
        leaveMonths: c.wifeParentalLeaveMonths,
      })),
      calendarYear
    );

    // 時短勤務係数（複数期間: 最初にマッチした期間の比率を適用）
    const husbandShortWorkMatch = husbandShortWorkPeriods.find(p => calendarYear >= p.startYear && calendarYear <= p.endYear);
    const husbandShortWorkFactor = husbandShortWorkMatch ? husbandShortWorkMatch.ratio : 1.0;
    const wifeShortWorkMatch = wifeShortWorkPeriods.find(p => calendarYear >= p.startYear && calendarYear <= p.endYear);
    const wifeShortWorkFactor = wifeShortWorkMatch ? wifeShortWorkMatch.ratio : 1.0;

    const husbandRetired = calendarYear >= husbandRetireCalYear;
    const wifeRetired = calendarYear >= wifeRetireCalYear;

    const hGrowth = Math.pow(1 + husbandRaiseRate / 100, year - 1);
    const wGrowth = Math.pow(1 + wifeRaiseRate / 100, year - 1);

    const hMonthly = husbandMonthlyBase * hGrowth;
    const wMonthly = wifeMonthlyBase * wGrowth;

    // 12ヶ月分（育休・時短・退職考慮）
    const husbandBaseNet = husbandRetired ? 0 : Math.round(hMonthly * 12 * husbandLeaveFactor * husbandShortWorkFactor);
    const wifeBaseNet = wifeRetired ? 0 : Math.round(wMonthly * 12 * wifeLeaveFactor * wifeShortWorkFactor);

    // ボーナス分（育休・時短・退職考慮）
    const husbandBonus = husbandRetired ? 0 : Math.round(hMonthly * husbandBonusMonths * husbandLeaveFactor * husbandShortWorkFactor);
    const wifeBonus = wifeRetired ? 0 : Math.round(wMonthly * wifeBonusMonths * wifeLeaveFactor * wifeShortWorkFactor);

    const husbandIncome = husbandBaseNet + husbandBonus;
    const wifeIncome = wifeBaseNet + wifeBonus;

    const husbandOnLeave = !husbandRetired && husbandLeaveFactor < 1;
    const wifeOnLeave = !wifeRetired && wifeLeaveFactor < 1;

    const householdIncome = husbandIncome + wifeIncome;
    const householdBaseIncome = husbandBaseNet + wifeBaseNet;

    // 世帯手取り（各人の総年収ベースで手取り率を推定）
    const husbandGrossAnnual = husbandRetired ? 0 : husbandAnnualIncome * hGrowth * husbandLeaveFactor * husbandShortWorkFactor;
    const wifeGrossAnnual = wifeRetired ? 0 : wifeAnnualIncome * wGrowth * wifeLeaveFactor * wifeShortWorkFactor;
    const householdTakeHome = Math.round(
      husbandIncome * getTakeHomeRate(husbandGrossAnnual) +
      wifeIncome * getTakeHomeRate(wifeGrossAnnual)
    );
    // ボーナスなし手取り（税引き率は総年収ベースで算出）
    const householdBaseTakeHome = Math.round(
      husbandBaseNet * getTakeHomeRate(husbandGrossAnnual) +
      wifeBaseNet * getTakeHomeRate(wifeGrossAnnual)
    );

    // 子ども費用（カスタム教育費 + 追加生活費 + 習い事）
    const childrenCost = children.reduce((sum, child) => {
      const educationCost = getAnnualEducationCostCustom(child, calendarYear);
      const age = calendarYear - child.birthYear;
      const extraCosts = getExtraMonthlyForAge(child, age) * 12;
      return sum + educationCost + extraCosts;
    }, 0);

    // 月払い + ボーナス返済を合算して万円換算
    const loanPayment = Math.round(
      (ann.totalPayment + ann.totalBonusPayment) / 10000
    );

    // 月額通常返済（ボーナス含まず、万円・小数1位）
    const monthlyRegularPayment = Math.round(ann.totalPayment / 12 / 10000 * 10) / 10;

    const livingCost = monthlyLivingCost * 12;

    // 住宅ローン控除: 年末残高を一人当たりの控除対象上限でキャップしてから控除率を適用
    const claimants = mortgageDeductionClaimants || 1;
    const balanceManYen = ann.balance / 10000;
    const cappedBalance = mortgageDeductionMaxPerPerson > 0
      ? Math.min(balanceManYen, mortgageDeductionMaxPerPerson * claimants)
      : balanceManYen;
    const mortgageDeduction = (mortgageDeductionRate > 0 && year <= mortgageDeductionYears)
      ? Math.round(cappedBalance * mortgageDeductionRate / 100)
      : 0;

    const lifeEventCost = lifeEvents
      .filter((e) => e.year === year)
      .reduce((sum, e) => sum + e.amount, 0);
    const incomeEventAmount = incomeEvents
      .filter((e) => e.year === year)
      .reduce((sum, e) => sum + e.amount, 0);

    const remainder = householdTakeHome + mortgageDeduction - loanPayment - livingCost - childrenCost;

    return {
      year,
      calendarYear,
      husbandAge: hAge,
      wifeAge: wAge,
      husbandIncome,
      wifeIncome,
      householdIncome,
      householdBaseIncome,
      householdTakeHome,
      householdBaseTakeHome,
      loanPayment,
      monthlyRegularPayment,
      livingCost,
      childrenCost,
      mortgageDeduction,
      lifeEventCost,
      incomeEventAmount,
      remainder,
      husbandOnLeave,
      wifeOnLeave,
    };
  });
}

export function calculateAssets(
  householdInput: HouseholdInput,
  loanResult: LoanResult,
  incomeInput?: IncomeInput,
  mortgageDeductionRate = 0,
  mortgageDeductionYears = 0,
  mortgageDeductionMaxPerPerson = 0,
  mortgageDeductionClaimants = 1,
  mortgageDeductionLoanType: 'joint' | 'pair' = 'joint',
): AnnualAssetRow[] {
  const {
    husbandCashAssets,
    husbandInvestmentAssets,
    wifeCashAssets,
    wifeInvestmentAssets,
    monthlyInvestment,
    averageYield,
    children,
    lifeEvents,
    incomeEvents,
  } = householdInput;
  const currentYear = new Date().getFullYear();

  let cashAssets = husbandCashAssets + wifeCashAssets;
  let investmentAssets = husbandInvestmentAssets + wifeInvestmentAssets;
  const rows: AnnualAssetRow[] = [];

  const cashFlow = incomeInput
    ? calculateCashFlow(
        loanResult,
        incomeInput,
        children,
        mortgageDeductionRate,
        mortgageDeductionYears,
        mortgageDeductionMaxPerPerson,
        mortgageDeductionClaimants,
        mortgageDeductionLoanType,
        lifeEvents,
        incomeEvents ?? [],
      )
    : null;

  for (let i = 0; i < loanResult.annual.length; i++) {
    const year = i + 1;
    const calendarYear = currentYear + year;

    const childrenCost = cashFlow
      ? cashFlow[i].childrenCost
      : children.reduce((sum, child) => {
          const educationCost = getAnnualEducationCostCustom(child, calendarYear);
          const age = calendarYear - child.birthYear;
          const extraCosts = getExtraMonthlyForAge(child, age) * 12;
          return sum + educationCost + extraCosts;
        }, 0);

    // cashFlow がある場合はそこから取得（calculateCashFlow に既に lifeEvents を渡している）
    const lifeEventCost = cashFlow
      ? cashFlow[i].lifeEventCost
      : lifeEvents.filter((e) => e.year === year).reduce((sum, e) => sum + e.amount, 0);
    const incomeEventAmount = cashFlow
      ? cashFlow[i].incomeEventAmount
      : (incomeEvents ?? []).filter((e) => e.year === year).reduce((sum, e) => sum + e.amount, 0);

    // 年間投資額（月額投資 × 12）
    const annualInvestment = monthlyInvestment * 12;

    if (cashFlow) {
      // remainder = 手取り + 控除 - ローン - 生活費 - 子ども費用（ライフイベントは含まず）
      cashAssets += cashFlow[i].remainder - annualInvestment - lifeEventCost + incomeEventAmount;
    } else {
      cashAssets += -lifeEventCost + incomeEventAmount;
    }

    // 投資資産: 複利成長 + 年間投資額
    investmentAssets = investmentAssets * (1 + averageYield / 100) + annualInvestment;

    const totalAssets = Math.round(cashAssets + investmentAssets);

    rows.push({
      year,
      totalAssets,
      cashAssets: Math.round(cashAssets),
      investmentAssets: Math.round(investmentAssets),
      loanBalance: Math.round(loanResult.annual[i].balance / 10000),
      childrenCost: Math.round(childrenCost),
      lifeEventCost: Math.round(lifeEventCost),
    });
  }

  return rows;
}
