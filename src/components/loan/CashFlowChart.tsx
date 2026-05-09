"use client";

import { useState } from "react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { calculateCashFlow } from "@/lib/calculations";
import type { LoanResult, IncomeInput, ChildInput } from "@/types";

type Props = {
  loanResult: LoanResult;
  incomeInput: IncomeInput;
  childList: ChildInput[];
  mortgageDeductionRate?: number;
  mortgageDeductionYears?: number;
  mortgageDeductionMaxPerPerson?: number;
  mortgageDeductionClaimants?: number;
  mortgageDeductionLoanType?: 'joint' | 'pair';
};

export default function CashFlowChart({ loanResult, incomeInput, childList, mortgageDeductionRate = 0, mortgageDeductionYears = 0, mortgageDeductionMaxPerPerson = 0, mortgageDeductionClaimants = 1, mortgageDeductionLoanType = 'joint' }: Props) {
  const [showTable, setShowTable] = useState(true);

  if (!loanResult.annual || loanResult.annual.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        ローン情報を入力してください
      </div>
    );
  }

  const data = calculateCashFlow(
    loanResult,
    incomeInput,
    childList,
    mortgageDeductionRate,
    mortgageDeductionYears,
    mortgageDeductionMaxPerPerson,
    mortgageDeductionClaimants,
    mortgageDeductionLoanType,
  );
  const hasNegativeRemainder = data.some((d) => d.remainder < 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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

          {/* 積み上げ棒グラフ: 年間ローン返済額 */}
          <Bar
            dataKey="loanPayment"
            name="年間ローン返済額（万円）"
            stackId="cost"
            fill="#ef4444"
          />

          {/* 積み上げ棒グラフ: 生活費 */}
          <Bar
            dataKey="livingCost"
            name="生活費（万円）"
            stackId="cost"
            fill="#f97316"
          />

          {/* 積み上げ棒グラフ: 子ども費用 */}
          <Bar
            dataKey="childrenCost"
            name="子ども費用（万円）"
            stackId="cost"
            fill="#8b5cf6"
          />

          {/* 折れ線: 世帯手取り */}
          <Line
            type="monotone"
            dataKey="householdTakeHome"
            name="世帯手取り（万円）"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
          />

          {/* 折れ線: 手残り（黒） */}
          <Line
            type="monotone"
            dataKey="remainder"
            name="手残り（万円）"
            stroke="#000000"
            dot={false}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {hasNegativeRemainder && (
        <p className="text-sm text-red-500">
          ⚠ 手残りがマイナスになる年があります
        </p>
      )}

      {/* 年次収支グラフ（手残り±） */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">年次収支（手残り）</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              label={{ value: "年", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis
              label={{ value: "万円", angle: -90, position: "insideLeft", offset: 10 }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString()} 万円`}
              labelFormatter={(label) => `${label} 年目`}
            />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Bar dataKey="remainder" name="年間収支（万円）">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.remainder >= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 年次収入テーブルの表示切替 */}
      <div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showTable ? "年次収入一覧を閉じる" : "年次収入一覧を表示"}
        </button>
      </div>

      {showTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">年目</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">西暦</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">夫の年齢</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">夫の年収（万円）</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">妻の年齢</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">妻の年収（万円）</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">世帯手取り（万円）</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">子ども費用（万円）</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">ローン控除（万円）</th>
                <th className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">手残り（万円）</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.year}
                  className={row.remainder < 0 ? "bg-red-50" : "hover:bg-gray-50"}
                >
                  <td className="border border-gray-200 px-3 py-1.5 text-right">{row.year}</td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right">{row.calendarYear}</td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right">
                    {row.husbandAge}歳
                    {row.husbandOnLeave && (
                      <span className="ml-1 text-xs text-blue-600 font-medium">育休</span>
                    )}
                    {row.husbandIncome === 0 && !row.husbandOnLeave && (
                      <span className="ml-1 text-xs text-gray-400">退職</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right">
                    {row.husbandIncome.toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right">
                    {row.wifeAge}歳
                    {row.wifeOnLeave && (
                      <span className="ml-1 text-xs text-blue-600 font-medium">育休</span>
                    )}
                    {row.wifeIncome === 0 && !row.wifeOnLeave && (
                      <span className="ml-1 text-xs text-gray-400">退職</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right">
                    {row.wifeIncome.toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right font-medium">
                    {row.householdTakeHome.toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right text-violet-700">
                    {row.childrenCost > 0 ? row.childrenCost.toLocaleString() : "—"}
                  </td>
                  <td className="border border-gray-200 px-3 py-1.5 text-right text-green-700">
                    {row.mortgageDeduction > 0 ? `+${row.mortgageDeduction.toLocaleString()}` : "—"}
                  </td>
                  <td className={`border border-gray-200 px-3 py-1.5 text-right font-medium ${
                    row.remainder < 0 ? "text-red-600" : "text-green-700"
                  }`}>
                    {row.remainder.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
