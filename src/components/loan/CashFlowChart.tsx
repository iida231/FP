"use client";

import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculateCashFlow } from "@/lib/calculations";
import type { LoanResult, IncomeInput } from "@/types";

type Props = {
  loanResult: LoanResult;
  incomeInput: IncomeInput;
};

export default function CashFlowChart({ loanResult, incomeInput }: Props) {
  if (!loanResult.annual || loanResult.annual.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        ローン情報を入力してください
      </div>
    );
  }

  const data = calculateCashFlow(loanResult, incomeInput);
  const hasNegativeRemainder = data.some((d) => d.remainder < 0);

  return (
    <div>
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

          {/* 手残り: プラスは緑、マイナスは赤 */}
          <Bar dataKey="remainder" name="手残り（万円）">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.remainder >= 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>

          {/* 折れ線: 世帯収入 */}
          <Line
            type="monotone"
            dataKey="householdIncome"
            name="世帯収入（万円）"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {hasNegativeRemainder && (
        <p className="text-sm text-red-500 mt-2">
          ⚠ 手残りがマイナスになる年があります
        </p>
      )}
    </div>
  );
}
