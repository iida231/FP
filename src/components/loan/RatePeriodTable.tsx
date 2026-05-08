"use client";

import type { RatePeriodInput } from "@/types";

type Props = {
  termYears: number;
  ratePeriods: RatePeriodInput[];
  onChange: (periods: RatePeriodInput[]) => void;
};

function validatePeriods(periods: RatePeriodInput[], termYears: number): string[] {
  const errors: string[] = [];

  if (periods.length === 0) {
    errors.push("金利期間を1件以上追加してください。");
    return errors;
  }

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (p.startYear > p.endYear) {
      errors.push(`行${i + 1}: 開始年は終了年以下にしてください。`);
    }
    if (p.annualRate < 0) {
      errors.push(`行${i + 1}: 年利は0以上にしてください。`);
    }
  }

  if (errors.length > 0) return errors;

  const sorted = [...periods].sort((a, b) => a.startYear - b.startYear);

  if (sorted[0].startYear !== 1) {
    errors.push(`開始年が1年目から始まっていません（現在: ${sorted[0].startYear}年目）。`);
  }

  if (sorted[sorted.length - 1].endYear !== termYears) {
    errors.push(
      `最終期間の終了年が返済期間（${termYears}年）と一致しません（現在: ${sorted[sorted.length - 1].endYear}年）。`
    );
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.endYear + 1 < next.startYear) {
      errors.push(
        `${current.endYear}年目と${next.startYear}年目の間に空白期間があります。`
      );
    } else if (current.endYear >= next.startYear) {
      errors.push(
        `${current.endYear}年目と${next.startYear}年目が重複しています。`
      );
    }
  }

  return errors;
}

export default function RatePeriodTable({ termYears, ratePeriods, onChange }: Props) {
  const errors = validatePeriods(ratePeriods, termYears);

  function handleChange(id: string, field: keyof Omit<RatePeriodInput, "id">, raw: string) {
    const updated = ratePeriods.map((p) => {
      if (p.id !== id) return p;
      return { ...p, [field]: raw === "" ? 0 : Number(raw) };
    });
    onChange(updated);
  }

  function handleAdd() {
    const newPeriod: RatePeriodInput = {
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : Date.now().toString(),
      startYear: 1,
      endYear: termYears,
      annualRate: 0,
    };
    onChange([...ratePeriods, newPeriod]);
  }

  function handleDelete(id: string) {
    onChange(ratePeriods.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                開始年
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                終了年
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                年利 (%)
              </th>
              <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 w-16">
                削除
              </th>
            </tr>
          </thead>
          <tbody>
            {ratePeriods.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="border border-gray-200 px-3 py-4 text-center text-gray-400 text-xs"
                >
                  金利期間が未設定です。下の「行を追加」ボタンで追加してください。
                </td>
              </tr>
            ) : (
              ratePeriods.map((period, index) => (
                <tr key={period.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      max={termYears}
                      value={period.startYear}
                      onChange={(e) => handleChange(period.id, "startYear", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      max={termYears}
                      value={period.endYear}
                      onChange={(e) => handleChange(period.id, "endYear", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={period.annualRate}
                      onChange={(e) => handleChange(period.id, "annualRate", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(period.id)}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      aria-label={`行${index + 1}を削除`}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="rounded border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
      >
        + 行を追加
      </button>

      {errors.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {errors.map((err, i) => (
            <li key={i} className="text-xs text-red-500">
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
