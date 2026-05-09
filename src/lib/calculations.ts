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
// month は 1 始まり（1〜n*12）
function getRateForMonth(month: number, ratePeriods: RatePeriodInput[]): number {
  const year = Math.ceil(month / 12);
  for (const period of ratePeriods) {
    if (year >= period.startYear && year <= period.endYear) {
      return period.annualRate;
    }
  }
  // 見つからない場合は最後の期間の金利を返す
  return ratePeriods[ratePeriods.length - 1].annualRate;
}

// 育休期間中の月収割合を計算する
// 日本の育児休業給付金制度: 最初6ヶ月=67%、以降=50%
// 複数の子どもで育休が重なる場合は最も低い割合を適用
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
  const { loanAmount, termYears, repaymentType, useFiveYearRule, use125PercentRule, ratePeriods } = input;
  const P = loanAmount * 10000; // 万円 → 円
  const n = termYears * 12;     // 総返済月数

  const monthlyRows: MonthlyPaymentRow[] = [];
  let balance = P;
  let fixedPayment = 0;        // 5年ルール: 固定月返済額
  let prevFixedPayment = 0;    // 125%ルール: 前回の固定月返済額
  let unpaidInterestAccum = 0; // 累積未払い利息

  for (let month = 1; month <= n; month++) {
    const annualRate = getRateForMonth(month, ratePeriods);
    const r = annualRate / 100 / 12; // 月利

    // 5年ルール: 5年ごとの見直し（または month=1 の初期化）
    if (useFiveYearRule && (month === 1 || month % 60 === 1)) {
      // 残期間で再計算
      const remainingMonths = n - month + 1;
      let newPayment: number;
      if (r === 0) {
        newPayment = balance / remainingMonths;
      } else {
        newPayment =
          (balance * (r * Math.pow(1 + r, remainingMonths))) /
          (Math.pow(1 + r, remainingMonths) - 1);
      }
      // 125%ルール: 前回の1.25倍を上限とする
      if (use125PercentRule && prevFixedPayment > 0) {
        newPayment = Math.min(newPayment, prevFixedPayment * 1.25);
      }
      prevFixedPayment = fixedPayment || newPayment;
      fixedPayment = newPayment;
    }

    if (repaymentType === "EQUAL_INSTALLMENT") {
      // 元利均等
      let payment: number;
      let principalPart: number;
      let interestPart: number;
      let unpaidThisMonth = 0;

      if (useFiveYearRule) {
        // 5年ルール: fixedPayment 固定
        interestPart = balance * r;
        if (fixedPayment >= interestPart) {
          principalPart = fixedPayment - interestPart;
          payment = fixedPayment;
        } else {
          // 未払い利息発生
          unpaidThisMonth = interestPart - fixedPayment;
          unpaidInterestAccum += unpaidThisMonth;
          principalPart = 0;
          payment = fixedPayment;
        }
      } else {
        // 通常の元利均等（金利変更時は毎月残高と残期間で再計算）
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

      balance = Math.max(0, balance - principalPart);

      monthlyRows.push({
        month,
        principal: Math.round(principalPart),
        interest: Math.round(interestPart),
        unpaidInterest: Math.round(unpaidInterestAccum),
        balance: Math.round(balance),
        payment: Math.round(payment),
      });
    } else {
      // 元金均等
      const principalPart = P / n;
      const interestPart = balance * r;
      const payment = principalPart + interestPart;
      balance = Math.max(0, balance - principalPart);

      monthlyRows.push({
        month,
        principal: Math.round(principalPart),
        interest: Math.round(interestPart),
        unpaidInterest: 0,
        balance: Math.round(balance),
        payment: Math.round(payment),
      });
    }
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
      balance: yearRows[yearRows.length - 1]?.balance ?? 0,
    });
  }

  const totalPayment = monthlyRows.reduce((s, row) => s + row.payment, 0);
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

  // 退職するカレンダー年（その年から収入0）
  const husbandRetireCalYear = currentYear + (husbandRetirementAge - husbandAge);
  const wifeRetireCalYear = currentYear + (wifeRetirementAge - wifeAge);

  return loanResult.annual.map((ann, i) => {
    const year = i + 1;
    const calendarYear = currentYear + year;
    const hAge = husbandAge + year;
    const wAge = wifeAge + year;

    // 育休の収入割合を計算（日本の育児休業給付金制度に基づく）
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

    // 昇給を考慮した基本年収
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
    const loanPayment = Math.round(ann.totalPayment / 10000); // 円 → 万円
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
    husbandAssets,
    wifeAssets,
    monthlyInvestment,
    averageYield,
    children,
    lifeEvents,
  } = householdInput;
  const currentYear = new Date().getFullYear();

  let assets = husbandAssets + wifeAssets; // 万円
  const rows: AnnualAssetRow[] = [];

  // 収入データがある場合は実際のキャッシュフローを使用
  const cashFlow = incomeInput
    ? calculateCashFlow(loanResult, incomeInput, children)
    : null;

  for (let i = 0; i < loanResult.annual.length; i++) {
    const year = i + 1;
    const calendarYear = currentYear + year;

    // 教育費計算
    const childrenCost = children.reduce(
      (sum, child) => sum + getAnnualEducationCost(child, calendarYear),
      0
    );

    // ライフイベント費用
    const lifeEventCost = lifeEvents
      .filter((e) => e.year === year)
      .reduce((sum, e) => sum + e.amount, 0);

    // 年間純貯蓄額
    // 収入データがある場合: 手残り（収入－ローン－生活費）から教育費・ライフイベントを差し引く
    // ない場合: 月間投資額ベースのフォールバック
    const annualSavings = cashFlow
      ? cashFlow[i].remainder - childrenCost - lifeEventCost
      : monthlyInvestment * 12 - childrenCost - lifeEventCost;

    // 資産推移: 複利成長 + 純貯蓄
    assets = assets * (1 + averageYield / 100) + annualSavings;

    rows.push({
      year,
      assets: Math.round(assets),
      loanBalance: Math.round(loanResult.annual[i].balance / 10000), // 円 → 万円
      childrenCost: Math.round(childrenCost),
      lifeEventCost: Math.round(lifeEventCost),
    });
  }

  return rows;
}
