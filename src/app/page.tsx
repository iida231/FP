"use client";

import { useState, useMemo } from "react";
import TabLayout from "@/components/layout/TabLayout";
import LoanForm from "@/components/loan/LoanForm";
import IncomeForm from "@/components/loan/IncomeForm";
import LoanRepaymentChart from "@/components/loan/LoanRepaymentChart";
import LoanSummaryCard from "@/components/loan/LoanSummaryCard";
import CashFlowChart from "@/components/loan/CashFlowChart";
import CashFlowPieChart from "@/components/loan/CashFlowPieChart";
import ChildrenSimulator from "@/components/household/ChildrenSimulator";
import AssetsForm from "@/components/household/AssetsForm";
import LifeEventsTable from "@/components/household/LifeEventsTable";
import AssetGrowthChart from "@/components/household/AssetGrowthChart";
import FinancialBreakdownChart from "@/components/household/FinancialBreakdownChart";
import IncomeEventsTable from "@/components/household/IncomeEventsTable";
import SavedList from "@/components/saved/SavedList";
import { calculateLoan, calculateCashFlow } from "@/lib/calculations";
import type {
  LoanInput,
  IncomeInput,
  HouseholdInput,
  RatePeriodInput,
  SimulationDetail,
} from "@/types";

type Tab = "loan" | "household" | "saved";

const DEFAULT_RATE_PERIOD: RatePeriodInput = {
  id: "1",
  startYear: 1,
  endYear: 35,
  annualRate: 1.0,
};

const DEFAULT_LOAN_INPUT: LoanInput = {
  loanAmount: 3000,
  termYears: 35,
  repaymentType: "EQUAL_INSTALLMENT",
  useFiveYearRule: false,
  use125PercentRule: false,
  ratePeriods: [DEFAULT_RATE_PERIOD],
  bonusRepaymentPerOccurrence: 0,
  mortgageDeductionRate: 0.7,
  mortgageDeductionYears: 13,
  mortgageDeductionMaxPerPerson: 0,
  mortgageDeductionClaimants: 1,
  mortgageDeductionLoanType: "joint",
};

const DEFAULT_INCOME_INPUT: IncomeInput = {
  husbandAnnualIncome: 500,
  wifeAnnualIncome: 300,
  husbandRaiseRate: 2,
  wifeRaiseRate: 2,
  monthlyLivingCost: 20,
  husbandAge: 30,
  wifeAge: 30,
  husbandRetirementAge: 65,
  wifeRetirementAge: 65,
  husbandSummerBonusMonths: 0,
  husbandWinterBonusMonths: 0,
  wifeSummerBonusMonths: 0,
  wifeWinterBonusMonths: 0,
};

const DEFAULT_HOUSEHOLD_INPUT: HouseholdInput = {
  husbandCashAssets: 0,
  husbandInvestmentAssets: 0,
  wifeCashAssets: 0,
  wifeInvestmentAssets: 0,
  monthlyInvestment: 3,
  averageYield: 3,
  children: [],
  lifeEvents: [
    { id: "1", eventName: "車購入", year: 5, amount: 300 },
    { id: "2", eventName: "自宅リフォーム", year: 15, amount: 200 },
    { id: "3", eventName: "家電買い替え", year: 10, amount: 50 },
  ],
  incomeEvents: [],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("loan");
  const [loanInput, setLoanInput] = useState<LoanInput>(DEFAULT_LOAN_INPUT);
  const [incomeInput, setIncomeInput] = useState<IncomeInput>(DEFAULT_INCOME_INPUT);
  const [householdInput, setHouseholdInput] = useState<HouseholdInput>(DEFAULT_HOUSEHOLD_INPUT);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loanResult = useMemo(() => calculateLoan(loanInput), [loanInput]);
  const cashFlow = useMemo(
    () => calculateCashFlow(
      loanResult,
      incomeInput,
      householdInput.children,
      loanInput.mortgageDeductionRate,
      loanInput.mortgageDeductionYears,
      loanInput.mortgageDeductionMaxPerPerson ?? 0,
      loanInput.mortgageDeductionClaimants ?? 1,
      loanInput.mortgageDeductionLoanType ?? "joint",
    ),
    [loanResult, incomeInput, householdInput.children, loanInput.mortgageDeductionRate, loanInput.mortgageDeductionYears, loanInput.mortgageDeductionMaxPerPerson, loanInput.mortgageDeductionClaimants, loanInput.mortgageDeductionLoanType]
  );

  const currentYear = new Date().getFullYear();

  async function handleSave() {
    const name = window.prompt("シミュレーション名を入力してください", "マイシミュレーション");
    if (!name) return;
    try {
      await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          loanAmount: loanInput.loanAmount,
          termYears: loanInput.termYears,
          repaymentType: loanInput.repaymentType,
          useFiveYearRule: loanInput.useFiveYearRule,
          use125PercentRule: loanInput.use125PercentRule,
          totalPayment: loanResult.totalPayment,
          bonusRepaymentPerOccurrence: loanInput.bonusRepaymentPerOccurrence,
          mortgageDeductionRate: loanInput.mortgageDeductionRate,
          mortgageDeductionYears: loanInput.mortgageDeductionYears,
          ratePeriods: loanInput.ratePeriods.map(({ startYear, endYear, annualRate }) => ({
            startYear,
            endYear,
            annualRate,
          })),
          household: {
            husbandAnnualIncome: incomeInput.husbandAnnualIncome,
            wifeAnnualIncome: incomeInput.wifeAnnualIncome,
            husbandRaiseRate: incomeInput.husbandRaiseRate,
            wifeRaiseRate: incomeInput.wifeRaiseRate,
            monthlyLivingCost: incomeInput.monthlyLivingCost,
            husbandAge: incomeInput.husbandAge,
            wifeAge: incomeInput.wifeAge,
            husbandRetirementAge: incomeInput.husbandRetirementAge,
            wifeRetirementAge: incomeInput.wifeRetirementAge,
            husbandCashAssets: householdInput.husbandCashAssets,
            husbandInvestmentAssets: householdInput.husbandInvestmentAssets,
            wifeCashAssets: householdInput.wifeCashAssets,
            wifeInvestmentAssets: householdInput.wifeInvestmentAssets,
            monthlyInvestment: householdInput.monthlyInvestment,
            averageYield: householdInput.averageYield,
            husbandSummerBonusMonths: incomeInput.husbandSummerBonusMonths,
            husbandWinterBonusMonths: incomeInput.husbandWinterBonusMonths,
            wifeSummerBonusMonths: incomeInput.wifeSummerBonusMonths,
            wifeWinterBonusMonths: incomeInput.wifeWinterBonusMonths,
            children: householdInput.children.map(({ name: n, birthYear, birthMonth, nursing, elementary, middle, high, university, husbandParentalLeaveMonths, wifeParentalLeaveMonths, extraMonthlyLivingCost, monthlyExtracurricular, customNursingCost, customElementaryCost, customMiddleCost, customHighCost, customUniversityCost }) => ({
              name: n, birthYear, birthMonth, nursing, elementary, middle, high, university, husbandParentalLeaveMonths, wifeParentalLeaveMonths, extraMonthlyLivingCost, monthlyExtracurricular, customNursingCost, customElementaryCost, customMiddleCost, customHighCost, customUniversityCost,
            })),
            lifeEvents: householdInput.lifeEvents.map(({ eventName, year, amount }) => ({
              eventName, year, amount,
            })),
          },
        }),
      });
      setSaveMessage("保存しました");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("保存に失敗しました");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  function handleLoadSimulation(detail: SimulationDetail) {
    setLoanInput({
      loanAmount: detail.loanAmount,
      termYears: detail.termYears,
      repaymentType: detail.repaymentType,
      useFiveYearRule: detail.useFiveYearRule,
      use125PercentRule: detail.use125PercentRule,
      bonusRepaymentPerOccurrence: detail.bonusRepaymentPerOccurrence ?? 0,
      mortgageDeductionRate: detail.mortgageDeductionRate ?? 0.7,
      mortgageDeductionYears: detail.mortgageDeductionYears ?? 13,
      mortgageDeductionMaxPerPerson: detail.mortgageDeductionMaxPerPerson ?? 0,
      mortgageDeductionClaimants: detail.mortgageDeductionClaimants ?? 1,
      ratePeriods: detail.ratePeriods.map((rp, i) => ({
        id: String(i + 1),
        startYear: rp.startYear,
        endYear: rp.endYear,
        annualRate: rp.annualRate,
      })),
    });
    if (detail.household) {
      setIncomeInput({
        husbandAnnualIncome: detail.household.husbandAnnualIncome,
        wifeAnnualIncome: detail.household.wifeAnnualIncome,
        husbandRaiseRate: detail.household.husbandRaiseRate,
        wifeRaiseRate: detail.household.wifeRaiseRate,
        monthlyLivingCost: detail.household.monthlyLivingCost,
        husbandAge: detail.household.husbandAge ?? 30,
        wifeAge: detail.household.wifeAge ?? 30,
        husbandRetirementAge: detail.household.husbandRetirementAge ?? 65,
        wifeRetirementAge: detail.household.wifeRetirementAge ?? 65,
        husbandSummerBonusMonths: detail.household.husbandSummerBonusMonths ?? 0,
        husbandWinterBonusMonths: detail.household.husbandWinterBonusMonths ?? 0,
        wifeSummerBonusMonths: detail.household.wifeSummerBonusMonths ?? 0,
        wifeWinterBonusMonths: detail.household.wifeWinterBonusMonths ?? 0,
      });
      setHouseholdInput({
        husbandCashAssets: detail.household.husbandCashAssets ?? 0,
        husbandInvestmentAssets: detail.household.husbandInvestmentAssets ?? 0,
        wifeCashAssets: detail.household.wifeCashAssets ?? 0,
        wifeInvestmentAssets: detail.household.wifeInvestmentAssets ?? 0,
        monthlyInvestment: detail.household.monthlyInvestment,
        averageYield: detail.household.averageYield,
        children: detail.household.children.map((c, i) => ({
          id: String(i + 1),
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
        lifeEvents: detail.household.lifeEvents.map((e, i) => ({
          id: String(i + 1),
          eventName: e.eventName,
          year: e.year,
          amount: e.amount,
        })),
        incomeEvents: [],
      });
    }
    setActiveTab("loan");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">金利君</h1>
            <p className="text-xs text-gray-500">
              住宅ローン返済シミュレーター・家計診断
            </p>
          </div>
          {activeTab === "loan" && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          )}
        </div>
        {saveMessage && (
          <div className="max-w-6xl mx-auto px-4 pb-2">
            <p className={`text-sm ${saveMessage.includes("失敗") ? "text-red-500" : "text-green-600"}`}>
              {saveMessage}
            </p>
          </div>
        )}
      </header>

      <TabLayout activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tab 1: ローンシミュレーター */}
        {activeTab === "loan" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoanForm value={loanInput} onChange={setLoanInput} />
              <IncomeForm value={incomeInput} onChange={setIncomeInput} />
            </div>

            <LoanSummaryCard
              loanResult={loanResult}
              loanAmount={loanInput.loanAmount}
            />

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">
                ローン返済グラフ
              </h2>
              <LoanRepaymentChart
                loanResult={loanResult}
                ratePeriods={loanInput.ratePeriods}
                termYears={loanInput.termYears}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-2">
                月間支払率
              </h2>
              <p className="text-xs text-gray-400 mb-4">年を選択して月間のローン・生活費・手残りの割合を確認できます</p>
              <CashFlowPieChart cashFlow={cashFlow} childList={householdInput.children} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">
                キャッシュフロー・年収概算一覧
              </h2>
              <CashFlowChart
                loanResult={loanResult}
                incomeInput={incomeInput}
                childList={householdInput.children}
                mortgageDeductionRate={loanInput.mortgageDeductionRate}
                mortgageDeductionYears={loanInput.mortgageDeductionYears}
                mortgageDeductionMaxPerPerson={loanInput.mortgageDeductionMaxPerPerson}
                mortgageDeductionClaimants={loanInput.mortgageDeductionClaimants}
                mortgageDeductionLoanType={loanInput.mortgageDeductionLoanType}
              />
            </div>
          </>
        )}

        {/* Tab 2: 家計診断 */}
        {activeTab === "household" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssetsForm value={householdInput} onChange={setHouseholdInput} />
              <LifeEventsTable
                events={householdInput.lifeEvents}
                onChange={(lifeEvents) =>
                  setHouseholdInput((prev) => ({ ...prev, lifeEvents }))
                }
              />
            </div>

            <IncomeEventsTable
              events={householdInput.incomeEvents ?? []}
              onChange={(incomeEvents) =>
                setHouseholdInput((prev) => ({ ...prev, incomeEvents }))
              }
            />

            <ChildrenSimulator
              childList={householdInput.children}
              currentYear={currentYear}
              termYears={loanInput.termYears}
              onChange={(children) =>
                setHouseholdInput((prev) => ({ ...prev, children }))
              }
            />

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">
                資産推移グラフ（総資産 vs ローン残債）
              </h2>
              <AssetGrowthChart
                householdInput={householdInput}
                loanResult={loanResult}
                currentYear={currentYear}
                incomeInput={incomeInput}
                mortgageDeductionRate={loanInput.mortgageDeductionRate}
                mortgageDeductionYears={loanInput.mortgageDeductionYears}
                mortgageDeductionMaxPerPerson={loanInput.mortgageDeductionMaxPerPerson}
                mortgageDeductionClaimants={loanInput.mortgageDeductionClaimants}
                mortgageDeductionLoanType={loanInput.mortgageDeductionLoanType}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-2">
                金融資産内訳グラフ（現金 + 投資資産）
              </h2>
              <p className="text-xs text-gray-400 mb-4">現金と投資資産の積み上がりを確認できます。月間投資額を「資産・投資情報」で設定してください。</p>
              <FinancialBreakdownChart
                householdInput={householdInput}
                loanResult={loanResult}
                incomeInput={incomeInput}
                mortgageDeductionRate={loanInput.mortgageDeductionRate}
                mortgageDeductionYears={loanInput.mortgageDeductionYears}
                mortgageDeductionMaxPerPerson={loanInput.mortgageDeductionMaxPerPerson}
                mortgageDeductionClaimants={loanInput.mortgageDeductionClaimants}
                mortgageDeductionLoanType={loanInput.mortgageDeductionLoanType}
              />
            </div>
          </>
        )}

        {/* Tab 3: 保存済み一覧 */}
        {activeTab === "saved" && (
          <SavedList onLoadSimulation={handleLoadSimulation} />
        )}
      </main>
    </div>
  );
}
