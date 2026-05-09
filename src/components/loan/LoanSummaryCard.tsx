"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { LoanResult } from "@/types";

type Props = {
  loanResult: LoanResult;
  loanAmount: number; // 万円
};

export default function LoanSummaryCard({ loanResult, loanAmount }: Props) {
  if (!loanResult.monthly || loanResult.monthly.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-64 text-gray-400">
        ローン情報を入力してください
      </div>
    );
  }

  const totalPaymentMan = Math.round(loanResult.totalPayment / 10000);
  const totalInterestMan = Math.round(loanResult.totalInterest / 10000);
  const totalBonusPaymentMan = Math.round(loanResult.totalBonusPayment / 10000);
  const interestRatio = (loanResult.totalInterest / loanResult.totalPayment * 100).toFixed(1);

  const pieData = [
    { name: "元金", value: loanAmount },
    { name: "利息", value: totalInterestMan },
  ];

  const COLORS = ["#3b82f6", "#f97316"];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">返済サマリー</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">合計返済額</p>
          <p className="text-lg font-bold text-gray-800">
            {totalPaymentMan.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">万円</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">ボーナス返済額</p>
          <p className="text-lg font-bold text-blue-600">
            {totalBonusPaymentMan.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">万円</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">利息総額</p>
          <p className="text-lg font-bold text-orange-500">
            {totalInterestMan.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">万円</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">利息割合</p>
          <p className="text-lg font-bold text-orange-500">
            {interestRatio}
            <span className="text-sm font-normal text-gray-500 ml-1">%</span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toLocaleString()} 万円`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
