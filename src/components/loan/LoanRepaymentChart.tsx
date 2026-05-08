"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { LoanResult, RatePeriodInput } from "@/types";

type Props = {
  loanResult: LoanResult;
  ratePeriods: RatePeriodInput[];
  termYears: number;
};

export default function LoanRepaymentChart({
  loanResult,
  ratePeriods,
  termYears,
}: Props) {
  if (!loanResult.monthly || loanResult.monthly.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-64 text-gray-400">
        ローン情報を入力してください
      </div>
    );
  }

  // 月次データ（LineChart用）
  const monthlyData = loanResult.monthly.map((row) => ({
    month: row.month,
    payment: row.payment,
  }));

  // 年次データ（BarChart用）— 万円換算
  const annualData = loanResult.annual.map((a) => ({
    year: a.year,
    totalPrincipal: Math.round(a.totalPrincipal / 10000),
    totalInterest: Math.round(a.totalInterest / 10000),
  }));

  // 金利変更タイミングの参照線（startYear=1 はスキップ）
  const rateChangeMarkers = ratePeriods
    .filter((rp) => rp.startYear > 1)
    .map((rp) => ({
      month: (rp.startYear - 1) * 12 + 1,
      rate: rp.annualRate,
    }));

  return (
    <div className="space-y-6">
      {/* グラフ1: 月次返済額推移 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          月次返済額推移
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={monthlyData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(value: number) => `${Math.ceil(value / 12)}年目`}
              interval={Math.floor((termYears * 12) / 10)}
            />
            <YAxis
              tickFormatter={(value: number) => value.toLocaleString()}
              label={{
                value: "円",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString()} 円`}
              labelFormatter={(label: number) =>
                `${label} ヶ月目（${Math.ceil(label / 12)} 年目）`
              }
            />
            <Legend />

            {/* 金利変更タイミングの参照線 */}
            {rateChangeMarkers.map((marker, idx) => (
              <ReferenceLine
                key={`rate-${idx}`}
                x={marker.month}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `${marker.rate}%`,
                  fontSize: 10,
                  fill: "#64748b",
                }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="payment"
              name="月返済額（円）"
              stroke="#1d4ed8"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* グラフ2: 年次元金・利息積み上げ棒グラフ */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          年次返済内訳（元金・利息）
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={annualData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              label={{
                value: "年目",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis
              tickFormatter={(value: number) => value.toLocaleString()}
              label={{
                value: "万円",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString()} 万円`}
              labelFormatter={(label: number) => `${label} 年目`}
            />
            <Legend />
            <Bar
              dataKey="totalPrincipal"
              name="元金（万円）"
              stackId="a"
              fill="#3b82f6"
            />
            <Bar
              dataKey="totalInterest"
              name="利息（万円）"
              stackId="a"
              fill="#f97316"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
