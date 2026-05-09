import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/generated/prisma/client";
import { RepaymentType } from "@/generated/prisma/enums";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export const runtime = "nodejs";

const INCLUDE_FULL = {
  ratePeriods: true,
  household: {
    include: {
      children: true,
      lifeEvents: true,
    },
  },
} as const;

// GET /api/simulations/[id] - シミュレーション詳細取得
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: idStr } = params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: INCLUDE_FULL,
    });

    if (!simulation) {
      return NextResponse.json(
        { error: "シミュレーションが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(simulation);
  } catch (error) {
    console.error("[GET /api/simulations/[id]]", error);
    return NextResponse.json(
      { error: "シミュレーションの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/simulations/[id] - シミュレーション更新
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: idStr } = params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    const body = await request.json();

    const {
      name,
      loanAmount,
      termYears,
      repaymentType,
      useFiveYearRule,
      use125PercentRule,
      totalPayment,
      bonusRepaymentPerOccurrence,
      mortgageDeductionRate,
      mortgageDeductionYears,
      mortgageDeductionMaxPerPerson,
      mortgageDeductionClaimants,
      ratePeriods,
      household,
    } = body as {
      name: string;
      loanAmount: number;
      termYears: number;
      repaymentType: RepaymentType;
      useFiveYearRule: boolean;
      use125PercentRule: boolean;
      totalPayment: number;
      bonusRepaymentPerOccurrence: number;
      mortgageDeductionRate: number;
      mortgageDeductionYears: number;
      mortgageDeductionMaxPerPerson?: number;
      mortgageDeductionClaimants?: number;
      ratePeriods: { startYear: number; endYear: number; annualRate: number }[];
      household?: {
        husbandAnnualIncome: number;
        wifeAnnualIncome: number;
        husbandRaiseRate: number;
        wifeRaiseRate: number;
        monthlyLivingCost: number;
        husbandAge: number;
        wifeAge: number;
        husbandRetirementAge: number;
        wifeRetirementAge: number;
        husbandCashAssets: number;
        husbandInvestmentAssets: number;
        wifeCashAssets: number;
        wifeInvestmentAssets: number;
        monthlyInvestment: number;
        averageYield: number;
        husbandSummerBonusMonths: number;
        husbandWinterBonusMonths: number;
        wifeSummerBonusMonths: number;
        wifeWinterBonusMonths: number;
        children: {
          name: string;
          birthYear: number;
          birthMonth: number;
          nursing: string;
          elementary: string;
          middle: string;
          high: string;
          university: string;
          husbandParentalLeaveMonths: number;
          wifeParentalLeaveMonths: number;
          extraMonthlyLivingCost: number;
          monthlyExtracurricular: number;
          customNursingCost: number;
          customElementaryCost: number;
          customMiddleCost: number;
          customHighCost: number;
          customUniversityCost: number;
        }[];
        lifeEvents: {
          eventName: string;
          year: number;
          amount: number;
        }[];
      };
    };

    const updated = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. 既存 ratePeriods を削除
      await tx.ratePeriod.deleteMany({ where: { simulationId: id } });

      // 2. 既存 household（children / lifeEvents を含む）を削除
      const existingHousehold = await tx.household.findUnique({
        where: { simulationId: id },
      });
      if (existingHousehold) {
        await tx.child.deleteMany({ where: { householdId: existingHousehold.id } });
        await tx.lifeEvent.deleteMany({ where: { householdId: existingHousehold.id } });
        await tx.household.delete({ where: { id: existingHousehold.id } });
      }

      // 3. Simulation を更新 + ratePeriods / household を再作成
      return tx.simulation.update({
        where: { id },
        data: {
          name,
          loanAmount,
          termYears,
          repaymentType,
          useFiveYearRule,
          use125PercentRule,
          totalPayment,
          bonusRepaymentPerOccurrence: bonusRepaymentPerOccurrence ?? 0,
          mortgageDeductionRate: mortgageDeductionRate ?? 0,
          mortgageDeductionYears: mortgageDeductionYears ?? 0,
          mortgageDeductionMaxPerPerson: mortgageDeductionMaxPerPerson ?? 0,
          mortgageDeductionClaimants: mortgageDeductionClaimants ?? 1,
          ratePeriods: {
            create: ratePeriods.map(({ startYear, endYear, annualRate }) => ({
              startYear,
              endYear,
              annualRate,
            })),
          },
          household: household
            ? {
                create: {
                  husbandAnnualIncome: household.husbandAnnualIncome,
                  wifeAnnualIncome: household.wifeAnnualIncome,
                  husbandRaiseRate: household.husbandRaiseRate,
                  wifeRaiseRate: household.wifeRaiseRate,
                  monthlyLivingCost: household.monthlyLivingCost,
                  husbandAge: household.husbandAge ?? 30,
                  wifeAge: household.wifeAge ?? 30,
                  husbandRetirementAge: household.husbandRetirementAge ?? 65,
                  wifeRetirementAge: household.wifeRetirementAge ?? 65,
                  husbandCashAssets: household.husbandCashAssets ?? 0,
                  husbandInvestmentAssets: household.husbandInvestmentAssets ?? 0,
                  wifeCashAssets: household.wifeCashAssets ?? 0,
                  wifeInvestmentAssets: household.wifeInvestmentAssets ?? 0,
                  monthlyInvestment: household.monthlyInvestment,
                  averageYield: household.averageYield,
                  husbandSummerBonusMonths: household.husbandSummerBonusMonths ?? 0,
                  husbandWinterBonusMonths: household.husbandWinterBonusMonths ?? 0,
                  wifeSummerBonusMonths: household.wifeSummerBonusMonths ?? 0,
                  wifeWinterBonusMonths: household.wifeWinterBonusMonths ?? 0,
                  children: {
                    create: household.children.map((c) => ({
                      name: c.name,
                      birthYear: c.birthYear,
                      birthMonth: c.birthMonth ?? 4,
                      nursing: c.nursing as never,
                      elementary: c.elementary as never,
                      middle: c.middle as never,
                      high: c.high as never,
                      university: c.university as never,
                      husbandParentalLeaveMonths: c.husbandParentalLeaveMonths ?? 0,
                      wifeParentalLeaveMonths: c.wifeParentalLeaveMonths ?? 12,
                      extraMonthlyLivingCost: c.extraMonthlyLivingCost ?? 2,
                      monthlyExtracurricular: c.monthlyExtracurricular ?? 0,
                      customNursingCost: c.customNursingCost ?? 19,
                      customElementaryCost: c.customElementaryCost ?? 5,
                      customMiddleCost: c.customMiddleCost ?? 49,
                      customHighCost: c.customHighCost ?? 51,
                      customUniversityCost: c.customUniversityCost ?? 82,
                    })),
                  },
                  lifeEvents: {
                    create: household.lifeEvents.map((e) => ({
                      eventName: e.eventName,
                      year: e.year,
                      amount: e.amount,
                    })),
                  },
                },
              }
            : undefined,
        },
        include: INCLUDE_FULL,
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/simulations/[id]]", error);
    return NextResponse.json(
      { error: "シミュレーションの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/simulations/[id] - シミュレーション削除
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: idStr } = params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    await prisma.simulation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/simulations/[id]]", error);
    return NextResponse.json(
      { error: "シミュレーションの削除に失敗しました" },
      { status: 500 }
    );
  }
}
