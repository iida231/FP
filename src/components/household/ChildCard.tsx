"use client";

import type { ChildInput } from "@/types";
import { EDUCATION_COSTS } from "@/lib/educationCosts";

type Props = {
  child: ChildInput;
  currentYear: number;
  onChange: (child: ChildInput) => void;
  onRemove: () => void;
};

type PublicPrivate = "PUBLIC" | "PRIVATE";

const STAGE_CONFIG: {
  key: keyof Pick<ChildInput, "nursing" | "elementary" | "middle" | "high">;
  label: string;
  ageLabel: string;
  years: number;
  customKey: keyof ChildInput;
}[] = [
  { key: "nursing",    label: "保育園", ageLabel: "0〜5歳",  years: 6, customKey: "customNursingCost" },
  { key: "elementary", label: "小学校", ageLabel: "6〜11歳", years: 6, customKey: "customElementaryCost" },
  { key: "middle",     label: "中学校", ageLabel: "12〜14歳",years: 3, customKey: "customMiddleCost" },
  { key: "high",       label: "高校",   ageLabel: "15〜17歳",years: 3, customKey: "customHighCost" },
];

const UNIVERSITY_OPTIONS: { value: ChildInput["university"]; label: string }[] = [
  { value: "NATIONAL",           label: "国立" },
  { value: "PRIVATE_HUMANITIES", label: "私立文系" },
  { value: "PRIVATE_SCIENCE",    label: "私立理系" },
];

const STAGE_LABELS: Record<string, string> = {
  nursing: "保育園", elementary: "小学校", middle: "中学校", high: "高校", university: "大学",
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ChildCard({ child, currentYear, onChange, onRemove }: Props) {
  const currentAge = currentYear - child.birthYear;

  function handleField<K extends keyof ChildInput>(key: K, value: ChildInput[K]) {
    onChange({ ...child, [key]: value });
  }

  // 学校種別変更時: カスタム費用をデフォルトにリセット
  function handleStageChange(
    key: keyof Pick<ChildInput, "nursing" | "elementary" | "middle" | "high">,
    customKey: keyof ChildInput,
    val: PublicPrivate
  ) {
    const newCost = (EDUCATION_COSTS[key] as Record<string, number>)[val];
    onChange({ ...child, [key]: val, [customKey]: newCost });
  }

  function handleUniversityChange(val: ChildInput["university"]) {
    const newCost = EDUCATION_COSTS.university[val];
    onChange({ ...child, university: val, customUniversityCost: newCost });
  }

  // 費用試算
  const educationTotal =
    child.customNursingCost * 6 +
    child.customElementaryCost * 6 +
    child.customMiddleCost * 3 +
    child.customHighCost * 3 +
    child.customUniversityCost * 4;

  const extraTotal = (child.extraMonthlyLivingCost + child.monthlyExtracurricular) * 12 * 22;
  const grandTotal = educationTotal + extraTotal;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={child.name}
          onChange={(e) => handleField("name", e.target.value)}
          placeholder="名前"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">
          現在 {currentAge >= 0 ? `${currentAge}歳` : "未誕生"}
        </span>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
          aria-label="削除"
        >
          削除
        </button>
      </div>

      {/* 生まれ年・月 */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600 w-20 shrink-0">生まれ年月</label>
        <input
          type="number"
          value={child.birthYear}
          onChange={(e) => handleField("birthYear", Number(e.target.value))}
          min={currentYear - 30}
          max={currentYear + 5}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-sm text-gray-400">年</span>
        <select
          value={child.birthMonth}
          onChange={(e) => handleField("birthMonth", Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
      </div>

      {/* 育休設定 */}
      <div className="bg-blue-50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-700">育休設定（育児休業給付金: 最初6ヶ月67%・以降50%）</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">夫の育休期間（ヶ月）</label>
            <input
              type="number"
              min={0}
              max={24}
              value={child.husbandParentalLeaveMonths}
              onChange={(e) => handleField("husbandParentalLeaveMonths", Number(e.target.value))}
              className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">妻の育休期間（ヶ月）</label>
            <input
              type="number"
              min={0}
              max={24}
              value={child.wifeParentalLeaveMonths}
              onChange={(e) => handleField("wifeParentalLeaveMonths", Number(e.target.value))}
              className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {/* 保育園〜高校: 公立/私立 + カスタム費用 */}
      <div className="space-y-2">
        {STAGE_CONFIG.map(({ key, label, customKey }) => (
          <div key={key} className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 w-16 shrink-0">{label}</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              {(["PUBLIC", "PRIVATE"] as PublicPrivate[]).map((val) => (
                <button
                  key={val}
                  onClick={() => handleStageChange(key, customKey, val)}
                  className={`px-3 py-1 transition-colors ${
                    child[key] === val
                      ? "bg-blue-500 text-white font-medium"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {val === "PUBLIC" ? "公立" : "私立"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <input
                type="number"
                min={0}
                step={1}
                value={child[customKey] as number}
                onChange={(e) => handleField(customKey, Number(e.target.value))}
                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-xs text-gray-400">万円/年</span>
            </div>
          </div>
        ))}

        {/* 大学 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 w-16 shrink-0">大学</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {UNIVERSITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleUniversityChange(value)}
                className={`px-3 py-1 transition-colors ${
                  child.university === value
                    ? "bg-blue-500 text-white font-medium"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <input
              type="number"
              min={0}
              step={1}
              value={child.customUniversityCost}
              onChange={(e) => handleField("customUniversityCost", Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-xs text-gray-400">万円/年</span>
          </div>
        </div>
      </div>

      {/* 追加費用 */}
      <div className="bg-green-50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-green-700">追加費用（0〜21歳まで毎年適用）</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">追加生活費（万円/月）</label>
            <input
              type="number"
              step={0.5}
              min={0}
              value={child.extraMonthlyLivingCost}
              onChange={(e) => handleField("extraMonthlyLivingCost", Number(e.target.value))}
              className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">習い事費（万円/月）</label>
            <input
              type="number"
              step={0.5}
              min={0}
              value={child.monthlyExtracurricular}
              onChange={(e) => handleField("monthlyExtracurricular", Number(e.target.value))}
              className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      </div>

      {/* 費用試算テーブル */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <p className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-2">費用試算</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="px-3 py-1.5 text-left font-medium">段階</th>
              <th className="px-3 py-1.5 text-left font-medium">年齢</th>
              <th className="px-3 py-1.5 text-right font-medium">年間費用</th>
              <th className="px-3 py-1.5 text-right font-medium">期間</th>
              <th className="px-3 py-1.5 text-right font-medium">小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {STAGE_CONFIG.map(({ key, label, ageLabel, years, customKey }) => (
              <tr key={key}>
                <td className="px-3 py-1.5">{label}</td>
                <td className="px-3 py-1.5 text-gray-400">{ageLabel}</td>
                <td className="px-3 py-1.5 text-right font-medium">{(child[customKey] as number).toLocaleString()}万</td>
                <td className="px-3 py-1.5 text-right text-gray-400">×{years}年</td>
                <td className="px-3 py-1.5 text-right font-semibold">{((child[customKey] as number) * years).toLocaleString()}万</td>
              </tr>
            ))}
            <tr>
              <td className="px-3 py-1.5">大学</td>
              <td className="px-3 py-1.5 text-gray-400">18〜21歳</td>
              <td className="px-3 py-1.5 text-right font-medium">{child.customUniversityCost.toLocaleString()}万</td>
              <td className="px-3 py-1.5 text-right text-gray-400">×4年</td>
              <td className="px-3 py-1.5 text-right font-semibold">{(child.customUniversityCost * 4).toLocaleString()}万</td>
            </tr>
            <tr className="bg-blue-50">
              <td className="px-3 py-1.5 font-semibold text-blue-800" colSpan={4}>教育費合計</td>
              <td className="px-3 py-1.5 text-right font-bold text-blue-800">{educationTotal.toLocaleString()}万</td>
            </tr>
            {(child.extraMonthlyLivingCost > 0 || child.monthlyExtracurricular > 0) && (
              <tr>
                <td className="px-3 py-1.5 text-gray-600" colSpan={2}>追加費用</td>
                <td className="px-3 py-1.5 text-right text-gray-600">{(child.extraMonthlyLivingCost + child.monthlyExtracurricular).toLocaleString()}万/月</td>
                <td className="px-3 py-1.5 text-right text-gray-400">×22年</td>
                <td className="px-3 py-1.5 text-right font-semibold">{Math.round(extraTotal).toLocaleString()}万</td>
              </tr>
            )}
            <tr className="bg-green-50">
              <td className="px-3 py-2 font-bold text-green-800" colSpan={4}>総合計</td>
              <td className="px-3 py-2 text-right font-bold text-green-800 text-sm">{Math.round(grandTotal).toLocaleString()}万</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
