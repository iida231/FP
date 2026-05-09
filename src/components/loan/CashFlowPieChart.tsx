"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { AnnualCashFlow } from "@/types";

type Props = {
  cashFlow: AnnualCashFlow[];
};

const COLORS = {
  loan: "#ef4444",
  living: "#f97316",
  remainder: "#22c55e",
  deficit: "#dc2626",
};

function fmt(val: number) {
  return `${val.toLocaleString()} 万円`;
}

function pct(part: number, total: number) {
  if (total <= 0) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

export default function CashFlowPieChart({ cashFlow }: Props) {
  const [selectedYear, setSelectedYear] = useState(1);

  if (!cashFlow || cashFlow.length === 0) return null;

  const row = cashFlow[selectedYear - 1];
  const monthly = {
    income: Math.round(row.householdIncome / 12),
    loan: Math.round(row.loanPayment / 12),
    living: Math.round(row.livingCost / 12),
    remainder: Math.round(row.remainder / 12),
  };

  const isDeficit = monthly.remainder < 0;

  // 円グラフ用データ（手残りがマイナスの場合は収入を超えた支出を表示）
  const pieData = isDeficit
    ? [
        { name: "ローン返済", value: monthly.loan, color: COLORS.loan },
        { name: "生活費", value: monthly.living, color: COLORS.living },
        { name: "収入超過支出", value: -monthly.remainder, color: COLORS.deficit },
      ]
    : [
        { name: "ローン返済", value: monthly.loan, color: COLORS.loan },
        { name: "生活費", value: monthly.living, color: COLORS.living },
        { name: "手残り", value: monthly.remainder, color: COLORS.remainder },
      ];

  const base = isDeficit
    ? monthly.loan + monthly.living + (-monthly.remainder)
    : monthly.income;

  return (
    <div className="space-y-4">
      {/* 年選択 */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">表示年:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {cashFlow.map((r) => (
            <option key={r.year} value={r.year}>
              {r.year}年目（{r.calendarYear}年 / 夫{r.husbandAge}歳・妻{r.wifeAge}歳）
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* 円グラフ */}
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name} ${fmt(value)}`}
              labelLine={true}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => fmt(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* 内訳テーブル */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            {row.year}年目の月間内訳（{row.calendarYear}年）
          </h4>

          {isDeficit && (
            <p className="text-xs text-red-600 font-medium">
              ⚠ 月間収入を支出が上回っています
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-600">月間世帯収入</span>
              <span className="font-semibold">{fmt(monthly.income)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS.loan }} />
                ローン返済
              </span>
              <span className="font-medium">
                {fmt(monthly.loan)}
                <span className="text-xs text-gray-400 ml-1">
                  ({pct(monthly.loan, monthly.income)})
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS.living }} />
                生活費
              </span>
              <span className="font-medium">
                {fmt(monthly.living)}
                <span className="text-xs text-gray-400 ml-1">
                  ({pct(monthly.living, monthly.income)})
                </span>
              </span>
            </div>
            <div className={`flex justify-between items-center py-1.5 border-t border-gray-200 font-semibold ${isDeficit ? "text-red-600" : "text-green-700"}`}>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: isDeficit ? COLORS.deficit : COLORS.remainder }}
                />
                {isDeficit ? "収入超過支出" : "手残り"}
              </span>
              <span>
                {fmt(monthly.remainder)}
                <span className="text-xs font-normal ml-1">
                  ({pct(Math.abs(monthly.remainder), base)})
                </span>
              </span>
            </div>
          </div>

          {/* 返済負担率 */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500 text-xs mb-1">返済負担率（ローン返済 ÷ 月収）</p>
            <p className={`text-lg font-bold ${
              monthly.income > 0 && monthly.loan / monthly.income > 0.35
                ? "text-red-600"
                : "text-blue-700"
            }`}>
              {monthly.income > 0
                ? `${((monthly.loan / monthly.income) * 100).toFixed(1)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">目安: 25%以下が安全・35%超は要注意</p>
          </div>
        </div>
      </div>
    </div>
  );
}
