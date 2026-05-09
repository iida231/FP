"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { HouseholdInput, IncomeInput, LoanResult } from "@/types";
import { calculateAssets } from "@/lib/calculations";

type Props = {
  householdInput: HouseholdInput;
  loanResult: LoanResult;
  incomeInput: IncomeInput;
  mortgageDeductionRate?: number;
  mortgageDeductionYears?: number;
  mortgageDeductionMaxPerPerson?: number;
  mortgageDeductionClaimants?: number;
  mortgageDeductionLoanType?: 'joint' | 'pair';
};

export default function FinancialBreakdownChart({
  householdInput,
  loanResult,
  incomeInput,
  mortgageDeductionRate = 0,
  mortgageDeductionYears = 0,
  mortgageDeductionMaxPerPerson = 0,
  mortgageDeductionClaimants = 1,
  mortgageDeductionLoanType = 'joint',
}: Props) {
  if (!loanResult.annual || loanResult.annual.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        データを入力してください
      </div>
    );
  }

  const data = calculateAssets(
    householdInput,
    loanResult,
    incomeInput,
    mortgageDeductionRate,
    mortgageDeductionYears,
    mortgageDeductionMaxPerPerson,
    mortgageDeductionClaimants,
    mortgageDeductionLoanType,
  );
  const loanTermYears = loanResult.annual.length;

  const lifeEventMarkers = householdInput.lifeEvents.filter(
    (e) => e.year >= 1 && e.year <= loanTermYears
  );
  const incomeEventMarkers = (householdInput.incomeEvents ?? []).filter(
    (e) => e.year >= 1 && e.year <= loanTermYears
  );

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          label={{ value: "年", position: "insideBottomRight", offset: -5 }}
        />
        <YAxis
          label={{
            value: "万円",
            angle: -90,
            position: "insideLeft",
            offset: 10,
          }}
        />
        <Tooltip
          formatter={(value: number) => `${value.toLocaleString()} 万円`}
          labelFormatter={(label) => `${label} 年目`}
        />
        <Legend />

        {/* ライフイベント（支出）の参照線 */}
        {lifeEventMarkers.map((event) => (
          <ReferenceLine
            key={`life-${event.id}`}
            x={event.year}
            stroke="#f97316"
            strokeDasharray="3 3"
            label={{ value: event.eventName, angle: -90, fontSize: 10 }}
          />
        ))}

        {/* 収入イベント（退職金・売却）の参照線 */}
        {incomeEventMarkers.map((event) => (
          <ReferenceLine
            key={`income-${event.id}`}
            x={event.year}
            stroke="#22c55e"
            strokeDasharray="3 3"
            label={{ value: event.eventName, angle: -90, fontSize: 10 }}
          />
        ))}

        <Area
          type="monotone"
          dataKey="cashAssets"
          name="現金資産（万円）"
          stackId="assets"
          stroke="#9ca3af"
          fill="#e5e7eb"
        />
        <Area
          type="monotone"
          dataKey="investmentAssets"
          name="投資資産（万円）"
          stackId="assets"
          stroke="#3b82f6"
          fill="#bfdbfe"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
