"use client";

import type { HouseholdInput } from "@/types";

type Props = {
  value: HouseholdInput;
  onChange: (value: HouseholdInput) => void;
};

export default function AssetsForm({ value, onChange }: Props) {
  const handleChange = (field: keyof HouseholdInput, raw: string) => {
    const num = parseFloat(raw);
    onChange({ ...value, [field]: isNaN(num) ? 0 : num });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">資産・投資情報</h2>

      {/* 夫・妻の現在資産額（横並び2カラム） */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            夫の現在資産額（万円）
          </label>
          <input
            type="number"
            min={0}
            value={value.husbandAssets}
            onChange={(e) => handleChange("husbandAssets", e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            妻の現在資産額（万円）
          </label>
          <input
            type="number"
            min={0}
            value={value.wifeAssets}
            onChange={(e) => handleChange("wifeAssets", e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 月間投資額 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          月間投資額（万円）
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={value.monthlyInvestment}
          onChange={(e) => handleChange("monthlyInvestment", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 平均利回り */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          平均利回り（%）
        </label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={value.averageYield}
          onChange={(e) => handleChange("averageYield", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
