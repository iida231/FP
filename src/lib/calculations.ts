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
} from "@/types";
import { getAnnualEducationCost } from "./educationCosts";

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

  return { monthly: monthlyRows, annual, totalPayment, totalInterest };
}

export function calculateCashFlow(
  loanResult: LoanResult,
  incomeInput: IncomeInput,
  children: ChildInput[] = []
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
  } = incomeInput;

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

    const husbandRetired = calendarYear >= husbandRetireCalYear;
    const wifeRetired = calendarYear >= wifeRetireCalYear;

    const husbandBaseIncome = Math.round(
      husbandAnnualIncome * Math.pow(1 + husbandRaiseRate / 100, year - 1)
    );
    const wifeBaseIncome = Math.round(
      wifeAnnualIncome * Math.pow(1 + wifeRaiseRate / 100, year - 1)
    );

    const husbandIncome = husbandRetired
      ? 0
      : Math.round(husbandBaseIncome * husbandLeaveFactor);
    const wifeIncome = wifeRetired
      ? 0
      : Math.round(wifeBaseIncome * wifeLeaveFactor);

    const husbandOnLeave = !husbandRetired && husbandLeaveFactor < 1;
    const wifeOnLeave = !wifeRetired && wifeLeaveFactor < 1;

    const householdIncome = husbandIncome + wifeIncome;
    // 月払い + ボーナス返済を合算して万円換算
    const loanPayment = Math.round(
      (ann.totalPayment + ann.totalBonusPayment) / 10000
    );
    const livingCost = monthlyLivingCost * 12;
    const remainder = householdIncome - loanPayment - livingCost;

    return {
      year,
      calendarYear,
      husbandAge: hAge,
      wifeAge: wAge,
      husbandIncome,
      wifeIncome,
      householdIncome,
      loanPayment,
      livingCost,
      remainder,
      husbandOnLeave,
      wifeOnLeave,
    };
  });
}

export function calculateAssets(
  householdInput: HouseholdInput,
  loanResult: LoanResult,
  incomeInput?: IncomeInput
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
  } = householdInput;
  const currentYear = new Date().getFullYear();

  // 現金資産は利回りなし、投資資産のみ複利で成長
  let cashAssets = husbandCashAssets + wifeCashAssets;
  let investmentAssets = husbandInvestmentAssets + wifeInvestmentAssets;
  const rows: AnnualAssetRow[] = [];

  const cashFlow = incomeInput
    ? calculateCashFlow(loanResult, incomeInput, children)
    : null;

  for (let i = 0; i < loanResult.annual.length; i++) {
    const year = i + 1;
    const calendarYear = currentYear + year;

    const childrenCost = children.reduce(
      (sum, child) => sum + getAnnualEducationCost(child, calendarYear),
      0
    );
    const lifeEventCost = lifeEvents
      .filter((e) => e.year === year)
      .reduce((sum, e) => sum + e.amount, 0);

    const annualSavings = cashFlow
      ? cashFlow[i].remainder - childrenCost - lifeEventCost
      : monthlyInvestment * 12 - childrenCost - lifeEventCost;

    // 投資資産: 複利成長 + 年間貯蓄
    investmentAssets = investmentAssets * (1 + averageYield / 100) + annualSavings;
    // 現金資産: 変化なし（利回り0%）

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
