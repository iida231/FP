"use client";

import type { IncomeInput } from "@/types";

type Props = {
  value: IncomeInput;
  onChange: (value: IncomeInput) => void;
};

function getTakeHomeRate(annualIncome: number): number {
  if (annualIncome <= 200) return 0.80;
  if (annualIncome <= 400) return 0.78;
  if (annualIncome <= 600) return 0.75;
  if (annualIncome <= 800) return 0.72;
  if (annualIncome <= 1000) return 0.68;
  return 0.65;
}

function IncomeInfo({ annualIncome, bonusMonths }: { annualIncome: number; bonusMonths: number }) {
  if (annualIncome <= 0) return null;
  const monthlyBase = annualIncome / (12 + bonusMonths);
  const takeHomeRate = getTakeHomeRate(annualIncome);
  const takeHome = Math.round(monthlyBase * takeHomeRate * 10) / 10;
  return (
    <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-800 space-y-0.5">
      <div>推定月収: <span className="font-semibold">{Math.round(monthlyBase * 10) / 10} 万円</span>
        {bonusMonths > 0 && <span className="text-blue-500 ml-1">（年収 ÷ {12 + bonusMonths}ヶ月）</span>}
      </div>
      <div>推定手取月収: <span className="font-semibold">{takeHome} 万円</span>
        <span className="text-blue-400 ml-1">（約{Math.round(takeHomeRate * 100)}%）</span>
      </div>
    </div>
  );
}

export default function IncomeForm({ value, onChange }: Props) {
  function handleField<K extends keyof IncomeInput>(field: K, fieldValue: IncomeInput[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  const husbandBonusMonths = value.husbandSummerBonusMonths + value.husbandWinterBonusMonths;
  const wifeBonusMonths = value.wifeSummerBonusMonths + value.wifeWinterBonusMonths;

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
            <label className="block text-sm font-medium text-gray-700">総年収（万円）</label>
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
          <div className="bg-amber-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700">ボーナス（月収の何ヶ月分）</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">夏ボーナス（ヶ月）</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={6}
                  value={value.husbandSummerBonusMonths}
                  onChange={(e) => handleField("husbandSummerBonusMonths", Number(e.target.value))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">冬ボーナス（ヶ月）</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={6}
                  value={value.husbandWinterBonusMonths}
                  onChange={(e) => handleField("husbandWinterBonusMonths", Number(e.target.value))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
          <IncomeInfo annualIncome={value.husbandAnnualIncome} bonusMonths={husbandBonusMonths} />
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
            <label className="block text-sm font-medium text-gray-700">総年収（万円）</label>
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
          <div className="bg-amber-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700">ボーナス（月収の何ヶ月分）</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">夏ボーナス（ヶ月）</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={6}
                  value={value.wifeSummerBonusMonths}
                  onChange={(e) => handleField("wifeSummerBonusMonths", Number(e.target.value))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">冬ボーナス（ヶ月）</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={6}
                  value={value.wifeWinterBonusMonths}
                  onChange={(e) => handleField("wifeWinterBonusMonths", Number(e.target.value))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
          <IncomeInfo annualIncome={value.wifeAnnualIncome} bonusMonths={wifeBonusMonths} />
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

      {/* 注記 */}
      <p className="text-xs text-gray-400">
        総年収はボーナスを含む1年間の収入合計です。推定月収 = 総年収 ÷ (12 + ボーナス月数)。育休は子ども設定（家計診断タブ）で入力。最初6ヶ月67%・以降50%（日本の給付金制度に準拠）
      </p>
    </div>
  );
}
