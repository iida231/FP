"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChildInput } from "@/types";
import ChildCard from "./ChildCard";
import { getAnnualEducationCostCustom, getSchoolStage, EDUCATION_COSTS } from "@/lib/educationCosts";

type Props = {
  childList: ChildInput[];
  currentYear: number;
  termYears: number;
  onChange: (childList: ChildInput[]) => void;
};

const CHILD_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
];

const EXTRA_COLORS = [
  "#93c5fd", // blue-300
  "#6ee7b7", // emerald-300
  "#fcd34d", // amber-300
  "#fca5a5", // red-300
  "#c4b5fd", // violet-300
  "#67e8f9", // cyan-300
];

const STAGE_LABELS: Record<string, string> = {
  nursing: "保育園", elementary: "小学校", middle: "中学校", high: "高校", university: "大学",
};

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
    customNursingCost:    EDUCATION_COSTS.nursing.PUBLIC,
    customElementaryCost: EDUCATION_COSTS.elementary.PUBLIC,
    customMiddleCost:     EDUCATION_COSTS.middle.PUBLIC,
    customHighCost:       EDUCATION_COSTS.high.PUBLIC,
    customUniversityCost: EDUCATION_COSTS.university.NATIONAL,
  };
}

type ChartRow = Record<string, number | string>;

function CustomTooltip({ active, payload, label, childList }: {
  active?: boolean;
  payload?: { dataKey: string; payload: ChartRow }[];
  label?: string | number;
  childList: ChildInput[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const rowData = payload[0]?.payload as ChartRow;
  const year = Number(label);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-lg min-w-[180px]">
      <p className="font-semibold mb-2">{year}年</p>
      {(childList as ChildInput[]).map((child: ChildInput) => {
        const childName = child.name || child.id;
        const edu = (rowData[`${childName}_edu`] as number) ?? 0;
        const extra = (rowData[`${childName}_extra`] as number) ?? 0;
        if (edu + extra === 0) return null;
        const age = year - child.birthYear;
        const stage = getSchoolStage(age);
        return (
          <div key={child.id} className="mb-1.5">
            <span className="font-medium">{childName}</span>
            {stage && <span className="text-gray-400 ml-1">（{STAGE_LABELS[stage]}）</span>}
            {edu > 0 && <div className="pl-2 text-gray-600">学費: {edu}万円</div>}
            {extra > 0 && <div className="pl-2 text-gray-500">追加費用: {extra}万円</div>}
            <div className="pl-2 font-semibold">計: {edu + extra}万円</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ChildrenSimulator({
  childList,
  currentYear,
  termYears,
  onChange,
}: Props) {
  const years = useMemo(
    () => Array.from({ length: termYears + 1 }, (_, i) => currentYear + i),
    [currentYear, termYears]
  );

  const chartData = useMemo(() => {
    return years.map((year) => {
      const row: ChartRow = { year };
      childList.forEach((child) => {
        const childName = child.name || child.id;
        const edu = getAnnualEducationCostCustom(child, year);
        const age = year - child.birthYear;
        const extra = (age >= 0 && age <= 21)
          ? ((child.extraMonthlyLivingCost ?? 0) + (child.monthlyExtracurricular ?? 0)) * 12
          : 0;
        row[`${childName}_edu`] = edu;
        row[`${childName}_extra`] = extra;
      });
      return row;
    });
  }, [years, childList]);

  const totalCost = useMemo(() => {
    return chartData.reduce((sum, row) => {
      return sum + childList.reduce((s, child) => {
        const childName = child.name || child.id;
        return s + ((row[`${childName}_edu`] as number) ?? 0) + ((row[`${childName}_extra`] as number) ?? 0);
      }, 0);
    }, 0);
  }, [chartData, childList]);

  function handleAdd() {
    const nextName = `子ども${childList.length + 1}`;
    onChange([...childList, createDefaultChild(nextName, currentYear)]);
  }

  function handleChange(index: number, updated: ChildInput) {
    onChange(childList.map((c, i) => (i === index ? updated : c)));
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
            <h3 className="text-sm font-semibold text-gray-700">年間教育費・追加費用の推移</h3>
            <span className="text-sm text-gray-500">
              期間合計：
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
              <Tooltip content={<CustomTooltip childList={childList} />} />
              <Legend />
              {childList.map((child, index) => {
                const childName = child.name || child.id;
                const eduColor = CHILD_COLORS[index % CHILD_COLORS.length];
                const extraColor = EXTRA_COLORS[index % EXTRA_COLORS.length];
                return [
                  <Bar
                    key={`${child.id}_edu`}
                    dataKey={`${childName}_edu`}
                    name={`${childName} 学費`}
                    stackId="education"
                    fill={eduColor}
                  />,
                  <Bar
                    key={`${child.id}_extra`}
                    dataKey={`${childName}_extra`}
                    name={`${childName} 追加費用`}
                    stackId="education"
                    fill={extraColor}
                    radius={index === childList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />,
                ];
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
