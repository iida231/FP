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
