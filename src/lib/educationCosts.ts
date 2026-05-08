// 文部科学省データに基づく年間教育費（万円）
export const EDUCATION_COSTS = {
  nursing:    { PUBLIC: 19,  PRIVATE: 40  },
  elementary: { PUBLIC: 5,   PRIVATE: 167 },
  middle:     { PUBLIC: 49,  PRIVATE: 143 },
  high:       { PUBLIC: 51,  PRIVATE: 105 },
  university: { NATIONAL: 82, PRIVATE_HUMANITIES: 115, PRIVATE_SCIENCE: 154 },
} as const;

// 年齢から学校段階を返す。該当なしなら null。
export function getSchoolStage(age: number): keyof typeof EDUCATION_COSTS | null {
  if (age >= 0 && age <= 5)   return 'nursing';
  if (age >= 6 && age <= 11)  return 'elementary';
  if (age >= 12 && age <= 14) return 'middle';
  if (age >= 15 && age <= 17) return 'high';
  if (age >= 18 && age <= 21) return 'university';
  return null;
}

// 特定の年における子ども1人の教育費を計算する（万円）
export function getAnnualEducationCost(
  child: { birthYear: number; nursing: string; elementary: string; middle: string; high: string; university: string },
  calendarYear: number
): number {
  const age = calendarYear - child.birthYear;
  const stage = getSchoolStage(age);
  if (!stage) return 0;

  const costs = EDUCATION_COSTS[stage] as Record<string, number>;

  if (stage === 'university') {
    return costs[child.university] ?? 0;
  }
  return costs[child[stage as keyof typeof child]] ?? 0;
}
