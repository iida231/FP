"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChildInput } from "@/types";
import ChildCard from "./ChildCard";
import { getAnnualEducationCost } from "@/lib/educationCosts";

type Props = {
  childList: ChildInput[];
  currentYear: number;
  termYears: number;
  onChange: (childList: ChildInput[]) => void;
};

// 子どもごとに固定色を割り当てる
const CHILD_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createDefaultChild(name: string, currentYear: number): ChildInput {
  return {
    id: generateId(),
    name,
    birthYear: currentYear - 3,
    birthMonth: 4,
    nursing:    "PUBLIC",
    elementary: "PUBLIC",
    middle:     "PUBLIC",
    high:       "PUBLIC",
    university: "NATIONAL",
    husbandParentalLeaveMonths: 0,
    wifeParentalLeaveMonths: 12,
    extraMonthlyLivingCost: 2,
    monthlyExtracurricular: 0,
  };
}

export default function ChildrenSimulator({
  childList,
  currentYear,
  termYears,
  onChange,
}: Props) {
  // X軸の年リスト
  const years = useMemo(
    () => Array.from({ length: termYears + 1 }, (_, i) => currentYear + i),
    [currentYear, termYears]
  );

  // グラフ用データ: [{ year, "子ども1": 80, "子ども2": 115, ... }, ...]
  const chartData = useMemo(() => {
    return years.map((year) => {
      const row: Record<string, number | string> = { year };
      childList.forEach((child) => {
        row[child.name || child.id] = getAnnualEducationCost(child, year);
      });
      return row;
    });
  }, [years, childList]);

  // 合計教育費（全期間）
  const totalCost = useMemo(() => {
    return chartData.reduce((sum, row) => {
      return (
        sum +
        childList.reduce((s, child) => {
          const cost = row[child.name || child.id];
          return s + (typeof cost === "number" ? cost : 0);
        }, 0)
      );
    }, 0);
  }, [chartData, childList]);

  function handleAdd() {
    const nextName = `子ども${childList.length + 1}`;
    onChange([...childList, createDefaultChild(nextName, currentYear)]);
  }

  function handleChange(index: number, updated: ChildInput) {
    const next = childList.map((c, i) => (i === index ? updated : c));
    onChange(next);
  }

  function handleRemove(index: number) {
    onChange(childList.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">子ども教育費シミュレーション</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + 子どもを追加
        </button>
      </div>

      {/* 子どもカード一覧 */}
      {childList.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          「子どもを追加」ボタンで子どもを登録してください
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childList.map((child, index) => (
            <ChildCard
              key={child.id}
              child={child}
              currentYear={currentYear}
              onChange={(updated) => handleChange(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}

      {/* グラフ */}
      {childList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">年間教育費の推移</h3>
            <span className="text-sm text-gray-500">
              シミュレーション期間合計：
              <span className="font-bold text-blue-600 ml-1">{totalCost.toLocaleString()} 万円</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}`}
                unit="万"
                width={48}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${value} 万円`, name]}
                labelFormatter={(label) => `${label}年`}
              />
              <Legend />
              {childList.map((child, index) => (
                <Bar
                  key={child.id}
                  dataKey={child.name || child.id}
                  stackId="education"
                  fill={CHILD_COLORS[index % CHILD_COLORS.length]}
                  radius={index === childList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
