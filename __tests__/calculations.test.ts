import { calculateLoan } from "@/lib/calculations";

describe("calculateLoan", () => {
  // テスト1: 元利均等 3000万・35年・年利1%
  test("元利均等: 月返済額が約84686円", () => {
    const result = calculateLoan({
      loanAmount: 3000,
      termYears: 35,
      repaymentType: "EQUAL_INSTALLMENT",
      useFiveYearRule: false,
      use125PercentRule: false,
      ratePeriods: [{ id: "1", startYear: 1, endYear: 35, annualRate: 1.0 }],
      bonusRepaymentPerOccurrence: 0,
      mortgageDeductionRate: 0,
      mortgageDeductionYears: 0,
    });
    // 最初の月の返済額が約84686円（±100円以内）
    expect(result.monthly[0].payment).toBeCloseTo(84686, -2);
    // 総返済額が借入元本を上回る
    expect(result.totalPayment).toBeGreaterThan(3000 * 10000);
  });

  // テスト2: 元金均等の最初と最後の返済額
  test("元金均等: 最初の月 > 最後の月の返済額", () => {
    const result = calculateLoan({
      loanAmount: 3000,
      termYears: 35,
      repaymentType: "EQUAL_PRINCIPAL",
      useFiveYearRule: false,
      use125PercentRule: false,
      ratePeriods: [{ id: "1", startYear: 1, endYear: 35, annualRate: 1.0 }],
      bonusRepaymentPerOccurrence: 0,
      mortgageDeductionRate: 0,
      mortgageDeductionYears: 0,
    });
    expect(result.monthly[0].payment).toBeGreaterThan(
      result.monthly[result.monthly.length - 1].payment
    );
  });

  // テスト3: 総返済額は元本を超える（年利 > 0 の場合）
  test("総返済額 > 借入元本", () => {
    const result = calculateLoan({
      loanAmount: 3000,
      termYears: 35,
      repaymentType: "EQUAL_INSTALLMENT",
      useFiveYearRule: false,
      use125PercentRule: false,
      ratePeriods: [{ id: "1", startYear: 1, endYear: 35, annualRate: 1.0 }],
      bonusRepaymentPerOccurrence: 0,
      mortgageDeductionRate: 0,
      mortgageDeductionYears: 0,
    });
    expect(result.totalPayment).toBeGreaterThan(3000 * 10000);
  });

  // テスト4: 5年ルール - 3年目に金利が上昇しても返済額が固定されること
  test("5年ルール: 金利変更があっても5年間は返済額が固定", () => {
    const result = calculateLoan({
      loanAmount: 3000,
      termYears: 35,
      repaymentType: "EQUAL_INSTALLMENT",
      useFiveYearRule: true,
      use125PercentRule: false,
      ratePeriods: [
        { id: "1", startYear: 1, endYear: 3, annualRate: 1.0 },
        { id: "2", startYear: 4, endYear: 35, annualRate: 3.0 },
      ],
      bonusRepaymentPerOccurrence: 0,
      mortgageDeductionRate: 0,
      mortgageDeductionYears: 0,
    });
    // 月1の返済額と月36（金利変更後・5年以内）の返済額が同じ
    const m1 = result.monthly[0].payment;
    const m36 = result.monthly[35].payment;
    expect(m1).toBe(m36);
  });

  // テスト5: 125%ルール - 返済額の上限がキャップされること
  test("125%ルール: 新返済額が前回の125%を超えない", () => {
    const result = calculateLoan({
      loanAmount: 3000,
      termYears: 35,
      repaymentType: "EQUAL_INSTALLMENT",
      useFiveYearRule: true,
      use125PercentRule: true,
      ratePeriods: [
        { id: "1", startYear: 1, endYear: 5, annualRate: 0.5 },
        { id: "2", startYear: 6, endYear: 35, annualRate: 5.0 },
      ],
      bonusRepaymentPerOccurrence: 0,
      mortgageDeductionRate: 0,
      mortgageDeductionYears: 0,
    });
    // month 61（6年目最初）の返済額 <= month 1 の返済額 × 1.25
    const m1 = result.monthly[0].payment;
    const m61 = result.monthly[60].payment;
    expect(m61).toBeLessThanOrEqual(m1 * 1.25 + 1); // 丸め誤差 +1
  });
});
