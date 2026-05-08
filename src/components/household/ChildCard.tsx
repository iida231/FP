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

      {/* 生まれ年 */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-20 shrink-0">生まれ年</label>
        <input
          type="number"
          value={child.birthYear}
          onChange={(e) => handleField("birthYear", Number(e.target.value))}
          min={currentYear - 30}
          max={currentYear + 5}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-sm text-gray-400">年</span>
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
    </div>
  );
}
