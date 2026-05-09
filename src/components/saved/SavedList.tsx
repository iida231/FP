"use client";

import { useCallback, useEffect, useState } from "react";
import type { SimulationDetail, SimulationSummary } from "@/types";
import SimulationCard from "./SimulationCard";

type Props = {
  onLoadSimulation: (detail: SimulationDetail) => void;
};

function buildSaveBody(detail: SimulationDetail, name: string) {
  return {
    name,
    loanAmount: detail.loanAmount,
    termYears: detail.termYears,
    repaymentType: detail.repaymentType,
    useFiveYearRule: detail.useFiveYearRule,
    use125PercentRule: detail.use125PercentRule,
    totalPayment: detail.totalPayment,
    bonusRepaymentPerOccurrence: detail.bonusRepaymentPerOccurrence ?? 0,
    mortgageDeductionRate: detail.mortgageDeductionRate ?? 0,
    mortgageDeductionYears: detail.mortgageDeductionYears ?? 0,
    ratePeriods: detail.ratePeriods.map(({ startYear, endYear, annualRate }) => ({
      startYear, endYear, annualRate,
    })),
    household: detail.household ? {
      husbandAnnualIncome: detail.household.husbandAnnualIncome,
      wifeAnnualIncome: detail.household.wifeAnnualIncome,
      husbandRaiseRate: detail.household.husbandRaiseRate,
      wifeRaiseRate: detail.household.wifeRaiseRate,
      monthlyLivingCost: detail.household.monthlyLivingCost,
      husbandAge: detail.household.husbandAge ?? 30,
      wifeAge: detail.household.wifeAge ?? 30,
      husbandRetirementAge: detail.household.husbandRetirementAge ?? 65,
      wifeRetirementAge: detail.household.wifeRetirementAge ?? 65,
      husbandCashAssets: detail.household.husbandCashAssets ?? 0,
      husbandInvestmentAssets: detail.household.husbandInvestmentAssets ?? 0,
      wifeCashAssets: detail.household.wifeCashAssets ?? 0,
      wifeInvestmentAssets: detail.household.wifeInvestmentAssets ?? 0,
      monthlyInvestment: detail.household.monthlyInvestment,
      averageYield: detail.household.averageYield,
      husbandSummerBonusMonths: detail.household.husbandSummerBonusMonths ?? 0,
      husbandWinterBonusMonths: detail.household.husbandWinterBonusMonths ?? 0,
      wifeSummerBonusMonths: detail.household.wifeSummerBonusMonths ?? 0,
      wifeWinterBonusMonths: detail.household.wifeWinterBonusMonths ?? 0,
      children: detail.household.children.map((c) => ({
        name: c.name,
        birthYear: c.birthYear,
        birthMonth: c.birthMonth ?? 4,
        nursing: c.nursing,
        elementary: c.elementary,
        middle: c.middle,
        high: c.high,
        university: c.university,
        husbandParentalLeaveMonths: c.husbandParentalLeaveMonths ?? 0,
        wifeParentalLeaveMonths: c.wifeParentalLeaveMonths ?? 12,
        extraMonthlyLivingCost: c.extraMonthlyLivingCost ?? 2,
        monthlyExtracurricular: c.monthlyExtracurricular ?? 0,
        customNursingCost:    c.customNursingCost    ?? 19,
        customElementaryCost: c.customElementaryCost ?? 5,
        customMiddleCost:     c.customMiddleCost     ?? 49,
        customHighCost:       c.customHighCost       ?? 51,
        customUniversityCost: c.customUniversityCost ?? 82,
      })),
      lifeEvents: detail.household.lifeEvents.map((e) => ({
        eventName: e.eventName,
        year: e.year,
        amount: e.amount,
      })),
    } : undefined,
  };
}

export default function SavedList({ onLoadSimulation }: Props) {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSimulations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/simulations");
      if (!res.ok) throw new Error("fetch failed");
      const data: SimulationSummary[] = await res.json();
      setSimulations(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  async function handleView(id: number) {
    const res = await fetch(`/api/simulations/${id}`);
    const detail: SimulationDetail = await res.json();
    onLoadSimulation(detail);
  }

  async function handleDuplicate(id: number) {
    const res = await fetch(`/api/simulations/${id}`);
    const detail: SimulationDetail = await res.json();
    await fetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSaveBody(detail, detail.name + "（コピー）")),
    });
    fetchSimulations();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/simulations/${id}`, { method: "DELETE" });
    setSimulations((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRename(id: number, newName: string) {
    const res = await fetch(`/api/simulations/${id}`);
    const detail: SimulationDetail = await res.json();
    await fetch(`/api/simulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSaveBody(detail, newName)),
    });
    setSimulations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500 text-sm">
        取得に失敗しました
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        保存されたシミュレーションはありません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {simulations.map((simulation) => (
        <SimulationCard
          key={simulation.id}
          simulation={simulation}
          onView={handleView}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      ))}
    </div>
  );
}
