"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { HouseholdInput, IncomeInput, LoanResult } from "@/types";
import { getSchoolStage } from "@/lib/educationCosts";
import { calculateAssets } from "@/lib/calculations";

// 子どもの学校段階が変わる年（保育園・小学校・中学・高校・大学入学）を返す
function getSchoolTransitionYears(
  householdInput: HouseholdInput,
  loanTermYears: number
): { year: number; label: string }[] {
  const baseYear = new Date().getFullYear();
  const transitions: { year: number; label: string }[] = [];

  const stageLabels: Record<string, string> = {
    nursing: "保育園入園",
    elementary: "小学校入学",
    middle: "中学入学",
    high: "高校入学",
    university: "大学入学",
  };

  // 学校段階が始まる年齢のリスト
  const transitionAges = [0, 6, 12, 15, 18];

  householdInput.children.forEach((child) => {
    transitionAges.forEach((age) => {
      const calendarYear = child.birthYear + age;
      const loanYear = calendarYear - baseYear;
      if (loanYear >= 1 && loanYear <= loanTermYears) {
        const stage = getSchoolStage(age);
        if (stage) {
          transitions.push({
            year: loanYear,
            label: `${child.name || "子ども"} ${stageLabels[stage]}`,
          });
        }
      }
    });
  });

  return transitions;
}

type Props = {
  householdInput: HouseholdInput;
  loanResult: LoanResult;
  currentYear: number;
  incomeInput: IncomeInput;
  mortgageDeductionRate?: number;
  mortgageDeductionYears?: number;
};

export default function AssetGrowthChart({
  householdInput,
  loanResult,
  incomeInput,
  mortgageDeductionRate = 0,
  mortgageDeductionYears = 0,
}: Props) {
  // データが空の場合はフォールバック表示
  if (!loanResult.annual || loanResult.annual.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        データを入力してください
      </div>
    );
  }

  const data = calculateAssets(householdInput, loanResult, incomeInput, mortgageDeductionRate, mortgageDeductionYears);
  const loanTermYears = loanResult.annual.length;

  // ライフイベントのマーカー
  const lifeEventMarkers = householdInput.lifeEvents.filter(
    (e) => e.year >= 1 && e.year <= loanTermYears
  );

  // 学校段階変化のマーカー
  const schoolMarkers = getSchoolTransitionYears(householdInput, loanTermYears);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
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

        {/* ライフイベントの参照線 */}
        {lifeEventMarkers.map((event) => (
          <ReferenceLine
            key={`life-${event.id}`}
            x={event.year}
            stroke="#f97316"
            strokeDasharray="3 3"
            label={{ value: event.eventName, angle: -90, fontSize: 11 }}
          />
        ))}

        {/* 学校段階変化の参照線 */}
        {schoolMarkers.map((marker, idx) => (
          <ReferenceLine
            key={`school-${idx}`}
            x={marker.year}
            stroke="#f97316"
            strokeDasharray="3 3"
            label={{ value: marker.label, angle: -90, fontSize: 11 }}
          />
        ))}

        <Line
          type="monotone"
          dataKey="totalAssets"
          name="総資産（万円）"
          stroke="#22c55e"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="investmentAssets"
          name="投資資産（万円）"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="cashAssets"
          name="現金資産（万円）"
          stroke="#9ca3af"
          dot={false}
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="loanBalance"
          name="ローン残債（万円）"
          stroke="#ef4444"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
