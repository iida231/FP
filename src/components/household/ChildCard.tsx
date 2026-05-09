"use client";

import type { ChildInput } from "@/types";

type Props = {
  child: ChildInput;
  currentYear: number;
  onChange: (child: ChildInput) => void;
  onRemove: () => void;
};

type PublicPrivate = "PUBLIC" | "PRIVATE";

const STAGE_LABELS: { key: keyof Pick<ChildInput, "nursing" | "elementary" | "middle" | "high">; label: string }[] = [
  { key: "nursing",    label: "保育園" },
  { key: "elementary", label: "小学校" },
  { key: "middle",     label: "中学校" },
  { key: "high",       label: "高校" },
];

const UNIVERSITY_OPTIONS: { value: ChildInput["university"]; label: string }[] = [
  { value: "NATIONAL",           label: "国立" },
  { value: "PRIVATE_HUMANITIES", label: "私立文系" },
  { value: "PRIVATE_SCIENCE",    label: "私立理系" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ChildCard({ child, currentYear, onChange, onRemove }: Props) {
  const currentAge = currentYear - child.birthYear;

  function handleField<K extends keyof ChildInput>(key: K, value: ChildInput[K]) {
    onChange({ ...child, [key]: value });
  }

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

      {/* 保育園〜高校: 公立/私立 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {STAGE_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-16 shrink-0">{label}</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              {(["PUBLIC", "PRIVATE"] as PublicPrivate[]).map((val) => (
                <button
                  key={val}
                  onClick={() => handleField(key, val)}
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
          </div>
        ))}
      </div>

      {/* 大学 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 w-16 shrink-0">大学</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {UNIVERSITY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleField("university", value)}
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
        <p className="text-xs text-gray-400">
          追加生活費のデフォルト（平均的な子育て費用の概算）: 2万円/月
        </p>
      </div>
    </div>
  );
}
