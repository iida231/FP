import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RepaymentType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

// GET /api/simulations - シミュレーション一覧取得
export async function GET() {
  try {
    const simulations = await prisma.simulation.findMany({
      select: {
        id: true,
        name: true,
        loanAmount: true,
        termYears: true,
        totalPayment: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(simulations);
  } catch (error) {
    console.error("[GET /api/simulations]", error);
    return NextResponse.json(
      { error: "シミュレーション一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/simulations - 新規シミュレーション保存
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      loanAmount,
      termYears,
      repaymentType,
      useFiveYearRule,
      use125PercentRule,
      totalPayment,
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
      ratePeriods: { startYear: number; endYear: number; annualRate: number }[];
      household?: {
        husbandAnnualIncome: number;
        wifeAnnualIncome: number;
        husbandRaiseRate: number;
        wifeRaiseRate: number;
        monthlyLivingCost: number;
        husbandAssets: number;
        wifeAssets: number;
        monthlyInvestment: number;
        averageYield: number;
        children: {
          name: string;
          birthYear: number;
          nursing: string;
          elementary: string;
          middle: string;
          high: string;
          university: string;
        }[];
        lifeEvents: {
          eventName: string;
          year: number;
          amount: number;
        }[];
      };
    };

    const simulation = await prisma.simulation.create({
      data: {
        name,
        loanAmount,
        termYears,
        repaymentType,
        useFiveYearRule,
        use125PercentRule,
        totalPayment,
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
                husbandAssets: household.husbandAssets,
                wifeAssets: household.wifeAssets,
                monthlyInvestment: household.monthlyInvestment,
                averageYield: household.averageYield,
                children: {
                  create: household.children.map((c) => ({
                    name: c.name,
                    birthYear: c.birthYear,
                    nursing: c.nursing as never,
                    elementary: c.elementary as never,
                    middle: c.middle as never,
                    high: c.high as never,
                    university: c.university as never,
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
      include: {
        ratePeriods: true,
        household: {
          include: {
            children: true,
            lifeEvents: true,
          },
        },
      },
    });

    return NextResponse.json(simulation, { status: 201 });
  } catch (error) {
    console.error("[POST /api/simulations]", error);
    return NextResponse.json(
      { error: "シミュレーションの保存に失敗しました" },
      { status: 500 }
    );
  }
}
