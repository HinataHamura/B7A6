import type { TenantProfile } from '../../../generated/prisma/index.js';

const WEIGHTS = {
  gender: 15,
  smoker: 15,
  pets: 15,
  sleepSchedule: 20,
  cleanliness: 20,
  budget: 15,
};

const MAX_SCORE = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);

const rangesOverlap = (
  minA?: number | null,
  maxA?: number | null,
  minB?: number | null,
  maxB?: number | null,
): boolean => {
  if (minA == null || maxA == null || minB == null || maxB == null) return false;
  return minA <= maxB && minB <= maxA;
};

export const calculateCompatibilityScore = (a: TenantProfile, b: TenantProfile): number => {
  let score = 0;

  if (a.gender && b.gender && (a.gender === b.gender || a.gender === 'ANY' || b.gender === 'ANY')) {
    score += WEIGHTS.gender;
  }

  if (a.smoker != null && b.smoker != null && a.smoker === b.smoker) {
    score += WEIGHTS.smoker;
  }

  if (a.hasPets != null && b.hasPets != null && a.hasPets === b.hasPets) {
    score += WEIGHTS.pets;
  }

  if (a.sleepSchedule && b.sleepSchedule) {
    if (a.sleepSchedule === b.sleepSchedule) {
      score += WEIGHTS.sleepSchedule;
    } else if (a.sleepSchedule === 'FLEXIBLE' || b.sleepSchedule === 'FLEXIBLE') {
      score += WEIGHTS.sleepSchedule * 0.5;
    }
  }

  if (a.cleanliness && b.cleanliness) {
    if (a.cleanliness === b.cleanliness) {
      score += WEIGHTS.cleanliness;
    } else if (a.cleanliness === 'MODERATE' || b.cleanliness === 'MODERATE') {
      score += WEIGHTS.cleanliness * 0.5;
    }
  }

  if (
    rangesOverlap(
      a.budgetMin ? Number(a.budgetMin) : null,
      a.budgetMax ? Number(a.budgetMax) : null,
      b.budgetMin ? Number(b.budgetMin) : null,
      b.budgetMax ? Number(b.budgetMax) : null,
    )
  ) {
    score += WEIGHTS.budget;
  }

  return Math.round((score / MAX_SCORE) * 100);
};
