"use client";

import type { IncomeInput } from "@/types";

type Props = {
  value: IncomeInput;
  onChange: (value: IncomeInput) => void;
};

export default function IncomeForm({ value, onChange }: Props) {
  function handleField<K extends keyof IncomeInput>(field: K, fieldValue: IncomeInput[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">収入・生活費</h2>

      {/* 夫・妻 横並び2カラム */}
      <div className="grid grid-cols-2 gap-4">
        {/* 夫 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-1">
            夫
          </h3>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">現在の年齢（歳）</label>
            <input
              type="number"
              min={18}
              max={80}
              value={value.husbandAge}
              onChange={(e) => handleField("husbandAge", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">退職予定年齢（歳）</label>
            <input
              type="number"
              min={40}
              max={80}
              value={value.husbandRetirementAge}
              onChange={(e) => handleField("husbandRetirementAge", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">年収（万円）</label>
            <input
              type="number"
              min={0}
              value={value.husbandAnnualIncome}
              onChange={(e) => handleField("husbandAnnualIncome", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">年収上昇率（%）</label>
            <input
              type="number"
              step={0.1}
              min={0}
              value={value.husbandRaiseRate}
              onChange={(e) => handleField("husbandRaiseRate", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 妻 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-1">
            妻
          </h3>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">現在の年齢（歳）</label>
            <input
              type="number"
              min={18}
              max={80}
              value={value.wifeAge}
              onChange={(e) => handleField("wifeAge", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">退職予定年齢（歳）</label>
            <input
              type="number"
              min={40}
              max={80}
              value={value.wifeRetirementAge}
              onChange={(e) => handleField("wifeRetirementAge", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">年収（万円）</label>
            <input
              type="number"
              min={0}
              value={value.wifeAnnualIncome}
              onChange={(e) => handleField("wifeAnnualIncome", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">年収上昇率（%）</label>
            <input
              type="number"
              step={0.1}
              min={0}
              value={value.wifeRaiseRate}
              onChange={(e) => handleField("wifeRaiseRate", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 月間生活費 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">月間生活費（万円）</label>
        <input
          type="number"
          min={0}
          value={value.monthlyLivingCost}
          onChange={(e) => handleField("monthlyLivingCost", Number(e.target.value))}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 育休の説明 */}
      <p className="text-xs text-gray-400">
        育休は子ども設定（家計診断タブ）で入力します。最初6ヶ月67%・以降50%（日本の給付金制度に準拠）
      </p>
    </div>
  );
}
