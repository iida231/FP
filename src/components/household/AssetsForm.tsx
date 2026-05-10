"use client";

import type { HouseholdInput } from "@/types";

type Props = {
  value: HouseholdInput;
  onChange: (value: HouseholdInput) => void;
};

export default function AssetsForm({ value, onChange }: Props) {
  function handleField(field: keyof HouseholdInput, raw: string) {
    const num = parseFloat(raw);
    onChange({ ...value, [field]: isNaN(num) ? 0 : num });
  }

  const totalCash = value.husbandCashAssets + value.wifeCashAssets;
  const totalInvestment = value.husbandInvestmentAssets + value.wifeInvestmentAssets;
  const total = totalCash + totalInvestment;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">資産・投資情報</h2>

      {/* 夫 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-1">夫の現在資産</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">現金資産（万円）</label>
            <input
              type="number"
              min={0}
              value={value.husbandCashAssets}
              onChange={(e) => handleField("husbandCashAssets", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">投資資産（万円）</label>
            <input
              type="number"
              min={0}
              value={value.husbandInvestmentAssets}
              onChange={(e) => handleField("husbandInvestmentAssets", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 妻 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-1">妻の現在資産</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">現金資産（万円）</label>
            <input
              type="number"
              min={0}
              value={value.wifeCashAssets}
              onChange={(e) => handleField("wifeCashAssets", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">投資資産（万円）</label>
            <input
              type="number"
              min={0}
              value={value.wifeInvestmentAssets}
              onChange={(e) => handleField("wifeInvestmentAssets", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 合計サマリ */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>現金資産合計</span>
          <span className="font-medium">{totalCash.toLocaleString()} 万円</span>
        </div>
        <div className="flex justify-between">
          <span>投資資産合計</span>
          <span className="font-medium text-blue-700">{totalInvestment.toLocaleString()} 万円</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-semibold text-gray-800">
          <span>総資産</span>
          <span>{total.toLocaleString()} 万円</span>
        </div>
      </div>

      {/* 月間投資額 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          月間投資額（万円）
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={value.monthlyInvestment}
          onChange={(e) => handleField("monthlyInvestment", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">毎月この金額を投資資産として積み立てます。残りの余剰金は現金として保持されます。</p>
      </div>

      {/* 投資利回り */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          投資資産の平均利回り（%）
        </label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={value.averageYield}
          onChange={(e) => handleField("averageYield", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">現金資産の利回りは0%として計算します。</p>
      </div>

      {/* 物件売却 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            id="propertySaleEnabled"
            type="checkbox"
            checked={value.propertySale != null}
            onChange={(e) => {
              onChange({
                ...value,
                propertySale: e.target.checked ? { year: 10, salePrice: 0 } : undefined,
              });
            }}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="propertySaleEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
            物件売却を設定する
          </label>
        </div>

        {value.propertySale != null && (
          <div className="space-y-3 pl-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">売却年（ローン開始から）</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={value.propertySale.year}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      onChange({ ...value, propertySale: { ...value.propertySale!, year: isNaN(num) ? 1 : num } });
                    }}
                    className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">年目</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">売却価格（万円）</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={value.propertySale.salePrice}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    onChange({ ...value, propertySale: { ...value.propertySale!, salePrice: isNaN(num) ? 0 : num } });
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">売却年にローン残債を自動返済し、差額（売却価格 − 残債）が現金資産に追加されます。売却年以降はローン返済が停止します。</p>
          </div>
        )}
      </div>
    </div>
  );
}
