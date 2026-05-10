"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { AnnualCashFlow, ChildInput } from "@/types";
import { getExtraMonthlyForAge } from "@/lib/calculations";

type Props = {
  cashFlow: AnnualCashFlow[];
  childList?: ChildInput[];
};

const COLORS = {
  loan: "#ef4444",
  living: "#f97316",
  children: "#8b5cf6",
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

export default function CashFlowPieChart({ cashFlow, childList = [] }: Props) {
  const [selectedYear, setSelectedYear] = useState(1);
  const [showBonus, setShowBonus] = useState(true);

  if (!cashFlow || cashFlow.length === 0) return null;

  const row = cashFlow[selectedYear - 1];

  // 手取りベースで表示（remainder の計算と一致させる）
  const annualTakeHome = showBonus ? row.householdTakeHome : row.householdBaseTakeHome;
  // ボーナス分の手取り差分（手残り補正用）
  const takeHomeBonusDiff = row.householdTakeHome - row.householdBaseTakeHome;

  // 月次子ども費用：追加生活費＋習い事のみ（教育費は ChildrenSimulator で別表示）
  const monthlyChildExtra = childList.reduce((sum, child) => {
    const age = row.calendarYear - child.birthYear;
    return sum + getExtraMonthlyForAge(child, age);
  }, 0);

  // 月額通常返済は calculateCashFlow が計算した monthlyRegularPayment を使用（ローン返済グラフと一致）
  const husbandAnnual = showBonus ? (row.husbandTakeHome ?? 0) : (row.husbandBaseTakeHome ?? 0);
  const wifeAnnual = showBonus ? (row.wifeTakeHome ?? 0) : (row.wifeBaseTakeHome ?? 0);

  const monthly = {
    income: Math.round(annualTakeHome / 12),
    husband: Number.isFinite(husbandAnnual) ? Math.round(husbandAnnual / 12) : 0,
    wife: Number.isFinite(wifeAnnual) ? Math.round(wifeAnnual / 12) : 0,
    loan: Math.round(row.monthlyRegularPayment * 10) / 10,
    living: Math.round(row.livingCost / 12),
    children: Math.round(monthlyChildExtra),
    deduction: Math.round(row.mortgageDeduction / 12),
    childBenefit: Math.round(row.childBenefit / 12 * 10) / 10,
    // remainder は householdTakeHome 基準。ボーナスなし時は手取りボーナス分を除く
    remainder: showBonus
      ? Math.round(row.remainder / 12)
      : Math.round((row.remainder - takeHomeBonusDiff) / 12),
  };

  const isDeficit = monthly.remainder < 0;

  const positiveItems = [
    { name: "ローン返済", value: monthly.loan, color: COLORS.loan },
    { name: "生活費", value: monthly.living, color: COLORS.living },
    ...(monthly.children > 0 ? [{ name: "子ども費用", value: monthly.children, color: COLORS.children }] : []),
  ];

  const pieData = isDeficit
    ? [
        ...positiveItems,
        { name: "収入超過支出", value: -monthly.remainder, color: COLORS.deficit },
      ]
    : [
        ...positiveItems,
        { name: "手残り", value: monthly.remainder, color: COLORS.remainder },
      ];

  const base = isDeficit
    ? positiveItems.reduce((s, i) => s + i.value, 0) + (-monthly.remainder)
    : monthly.income;

  const hasBonus = takeHomeBonusDiff > 0;

  return (
    <div className="space-y-4">
      {/* コントロール行 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
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

        {/* ボーナス切替ボタン */}
        {hasBonus && (
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setShowBonus(true)}
              className={`px-3 py-1.5 transition-colors ${
                showBonus ? "bg-amber-500 text-white font-medium" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              ボーナス込み
            </button>
            <button
              onClick={() => setShowBonus(false)}
              className={`px-3 py-1.5 transition-colors ${
                !showBonus ? "bg-gray-600 text-white font-medium" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              ボーナスなし
            </button>
          </div>
        )}
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
            {!showBonus && hasBonus && (
              <span className="ml-2 text-xs font-normal text-gray-400">ボーナスなし</span>
            )}
          </h4>

          {isDeficit && (
            <p className="text-xs text-red-600 font-medium">
              ⚠ 月間収入を支出が上回っています
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-600">月間世帯収入（手取り）</span>
              <span className="font-semibold">
                {fmt(monthly.income)}
                {!showBonus && hasBonus && (
                  <span className="text-xs text-gray-400 ml-1">（ボーナスなし）</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-600">月間夫の手取り</span>
              <span className="font-medium">{fmt(monthly.husband)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-600">月間妻の手取り</span>
              <span className="font-medium">{fmt(monthly.wife)}</span>
            </div>
            {monthly.childBenefit > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="flex items-center gap-1.5 text-teal-700">
                  <span className="inline-block w-3 h-3 rounded-sm bg-teal-200" />
                  児童手当
                </span>
                <span className="font-medium text-teal-700">
                  +{fmt(monthly.childBenefit)}
                  <span className="text-xs font-normal text-teal-600 ml-1">
                    （年間 {row.childBenefit.toLocaleString()} 万円）
                  </span>
                </span>
              </div>
            )}
            {monthly.deduction > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="flex items-center gap-1.5 text-green-700">
                  <span className="inline-block w-3 h-3 rounded-sm bg-green-200" />
                  住宅ローン控除
                </span>
                <span className="font-medium text-green-700">
                  +{fmt(monthly.deduction)}
                  <span className="text-xs font-normal text-green-600 ml-1">
                    （年間 {row.mortgageDeduction.toLocaleString()} 万円）
                  </span>
                </span>
              </div>
            )}
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
            {monthly.children > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS.children }} />
                  子ども費用
                </span>
                <span className="font-medium">
                  {fmt(monthly.children)}
                  <span className="text-xs text-gray-400 ml-1">
                    ({pct(monthly.children, monthly.income)})
                  </span>
                </span>
              </div>
            )}
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
