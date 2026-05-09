"use client";

import type { LoanInput, RatePeriodInput } from "@/types";
import RatePeriodTable from "./RatePeriodTable";

type Props = {
  value: LoanInput;
  onChange: (value: LoanInput) => void;
};

export default function LoanForm({ value, onChange }: Props) {
  function handleField<K extends keyof LoanInput>(field: K, fieldValue: LoanInput[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">ローン条件</h2>

      {/* 借入金額 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          借入金額（万円）
        </label>
        <input
          type="number"
          min={100}
          max={99900}
          step={100}
          value={value.loanAmount}
          onChange={(e) => handleField("loanAmount", Number(e.target.value))}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 返済期間 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          返済期間（年）
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={value.termYears}
          onChange={(e) => handleField("termYears", Number(e.target.value))}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 返済方式 */}
      <div className="space-y-1">
        <span className="block text-sm font-medium text-gray-700">返済方式</span>
        <div className="flex gap-2">
          {(
            [
              { label: "元利均等", val: "EQUAL_INSTALLMENT" },
              { label: "元金均等", val: "EQUAL_PRINCIPAL" },
            ] as const
          ).map(({ label, val }) => (
            <button
              key={val}
              type="button"
              onClick={() => handleField("repaymentType", val)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                value.repaymentType === val
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ルール */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">オプション</span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.useFiveYearRule}
            onChange={(e) => handleField("useFiveYearRule", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">5年ルールを適用する</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.use125PercentRule}
            onChange={(e) => handleField("use125PercentRule", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">125%ルールを適用する</span>
        </label>
      </div>

      {/* ボーナス返済 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          ボーナス返済額（1回あたり・万円）
        </label>
        <input
          type="number"
          min={0}
          step={10}
          value={value.bonusRepaymentPerOccurrence}
          onChange={(e) => handleField("bonusRepaymentPerOccurrence", Number(e.target.value))}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400">年2回（6月・12月）元本を追加返済します。0の場合は適用なし。</p>
      </div>

      {/* 住宅ローン控除 */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">住宅ローン控除</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">控除率（%）</label>
            <input
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={value.mortgageDeductionRate}
              onChange={(e) => handleField("mortgageDeductionRate", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">控除期間（年）</label>
            <input
              type="number"
              min={0}
              max={15}
              value={value.mortgageDeductionYears}
              onChange={(e) => handleField("mortgageDeductionYears", Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">年末ローン残高 × 控除率を毎年税還付として計上します。0.7%・13年が一般的です（0に設定すると適用なし）。</p>
      </div>

      {/* 金利期間テーブル */}
      <div className="space-y-1">
        <span className="block text-sm font-medium text-gray-700">金利設定</span>
        <RatePeriodTable
          termYears={value.termYears}
          ratePeriods={value.ratePeriods}
          onChange={(periods: RatePeriodInput[]) => handleField("ratePeriods", periods)}
        />
      </div>
    </div>
  );
}
