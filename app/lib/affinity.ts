import { affinityGroups, cardById, raceById } from "./data";
import type {
  FamilyPlan,
  FamilySlotKey,
  PlannerSlot,
  Veteran,
} from "./types";

const groupsByCharacter = new Map<
  number,
  { id: number; points: number; members: readonly number[] }[]
>();

for (const group of affinityGroups) {
  for (const charId of group.members) {
    const current = groupsByCharacter.get(charId) ?? [];
    current.push(group);
    groupsByCharacter.set(charId, current);
  }
}

export function pairAffinity(first: number, second: number) {
  if (!first || !second || first === second) return 0;
  const secondGroups = new Set(
    (groupsByCharacter.get(second) ?? []).map((group) => group.id),
  );
  return (groupsByCharacter.get(first) ?? []).reduce(
    (score, group) => score + (secondGroups.has(group.id) ? group.points : 0),
    0,
  );
}

export function trioAffinity(first: number, second: number, third: number) {
  if (!first || !second || !third) return 0;
  return (groupsByCharacter.get(first) ?? []).reduce(
    (score, group) =>
      score +
      (group.members.includes(second) && group.members.includes(third)
        ? group.points
        : 0),
    0,
  );
}

const slotOrder: FamilySlotKey[] = [
  "parent1",
  "grandparent1A",
  "grandparent1B",
  "parent2",
  "grandparent2A",
  "grandparent2B",
];

const slotCharacter = (slot: PlannerSlot, veterans: Veteran[]) =>
  slot.veteranId
    ? veterans.find((veteran) => veteran.id === slot.veteranId)?.charId ??
      slot.charId
    : slot.charId;

const veteranForSlot = (slot: PlannerSlot, veterans: Veteran[]) =>
  slot.veteranId
    ? veterans.find((veteran) => veteran.id === slot.veteranId)
    : undefined;

const raceNames = (veteran: Veteran | undefined) =>
  new Set(
    (veteran?.raceIds ?? [])
      .map((id) => raceById.get(id)?.name)
      .filter((name): name is string => Boolean(name)),
  );

const intersectionCount = (first: Set<string>, second: Set<string>) => {
  let count = 0;
  for (const value of first) if (second.has(value)) count += 1;
  return count;
};

export const CROWN_SETS = [
  {
    name: "Classic Triple Crown",
    races: [
      "Satsuki Sho",
      "Tokyo Yushun (Japanese Derby)",
      "Kikuka Sho",
    ],
  },
  {
    name: "Triple Tiara",
    races: ["Oka Sho", "Japanese Oaks", "Shuka Sho"],
  },
  {
    name: "Spring Senior Triple Crown",
    races: ["Osaka Hai", "Tenno Sho (Spring)", "Takarazuka Kinen"],
  },
  {
    name: "Autumn Senior Triple Crown",
    races: ["Tenno Sho (Autumn)", "Japan Cup", "Arima Kinen"],
  },
] as const;

const sharedCrownCount = (first: Set<string>, second: Set<string>) =>
  CROWN_SETS.filter((set) =>
    set.races.every((race) => first.has(race) && second.has(race)),
  ).length;

export type FamilyBreakdown = {
  label: string;
  value: number;
  kind: "pair" | "trio" | "race";
}[];

export function calculateFamilyAffinity(
  family: FamilyPlan,
  veterans: Veteran[],
) {
  const target = cardById.get(family.targetCardId)?.charId ?? 0;
  const values = Object.fromEntries(
    slotOrder.map((key) => [
      key,
      slotCharacter(family.slots[key], veterans),
    ]),
  ) as Record<FamilySlotKey, number>;

  const breakdown: FamilyBreakdown = [
    {
      label: "Target ↔ Parent 1",
      value: pairAffinity(target, values.parent1),
      kind: "pair",
    },
    {
      label: "Target + Parent 1 + GP 1A",
      value: trioAffinity(
        target,
        values.parent1,
        values.grandparent1A,
      ),
      kind: "trio",
    },
    {
      label: "Target + Parent 1 + GP 1B",
      value: trioAffinity(
        target,
        values.parent1,
        values.grandparent1B,
      ),
      kind: "trio",
    },
    {
      label: "Target ↔ Parent 2",
      value: pairAffinity(target, values.parent2),
      kind: "pair",
    },
    {
      label: "Target + Parent 2 + GP 2A",
      value: trioAffinity(
        target,
        values.parent2,
        values.grandparent2A,
      ),
      kind: "trio",
    },
    {
      label: "Target + Parent 2 + GP 2B",
      value: trioAffinity(
        target,
        values.parent2,
        values.grandparent2B,
      ),
      kind: "trio",
    },
    {
      label: "Parent 1 ↔ Parent 2",
      value: pairAffinity(values.parent1, values.parent2),
      kind: "pair",
    },
  ];

  const countedPairs: [FamilySlotKey, FamilySlotKey][] = [
    ["parent1", "parent2"],
    ["parent1", "grandparent1A"],
    ["parent1", "grandparent1B"],
    ["parent2", "grandparent2A"],
    ["parent2", "grandparent2B"],
  ];

  let sharedRaceBonus = 0;
  let sharedCrownBonus = 0;
  const raceDetails = countedPairs.map(([firstKey, secondKey]) => {
    const first = raceNames(veteranForSlot(family.slots[firstKey], veterans));
    const second = raceNames(
      veteranForSlot(family.slots[secondKey], veterans),
    );
    const sharedRaces = intersectionCount(first, second);
    const sharedCrowns = sharedCrownCount(first, second);
    sharedRaceBonus += sharedRaces;
    sharedCrownBonus += sharedCrowns;
    return {
      firstKey,
      secondKey,
      sharedRaces,
      sharedCrowns,
      bonus: sharedRaces + sharedCrowns,
    };
  });

  const base = breakdown.reduce((sum, item) => sum + item.value, 0);
  const total = base + sharedRaceBonus + sharedCrownBonus;

  return {
    target,
    values,
    breakdown,
    raceDetails,
    base,
    sharedRaceBonus,
    sharedCrownBonus,
    total,
    ...affinityTier(total),
  };
}

export function affinityTier(score: number) {
  if (score >= 151)
    return {
      symbol: "◎",
      tier: "Great",
      next: 0,
      tone: "great" as const,
    };
  if (score >= 51)
    return {
      symbol: "○",
      tier: "Good",
      next: 151 - score,
      tone: "good" as const,
    };
  return {
    symbol: "△",
    tier: "Poor",
    next: 51 - score,
    tone: "poor" as const,
  };
}

export const blueStartingBonus = (stars: number) =>
  ({ 1: 5, 2: 12, 3: 21 })[stars] ?? 0;

export const blueThreeStarChance = (finalStat: number) =>
  finalStat > 1100 ? 10 : finalStat >= 600 ? 5 : 0;

export const startingAptitudeRanks = (totalStars: number) => {
  if (totalStars <= 0) return 0;
  return Math.min(4, 1 + Math.floor((totalStars - 1) / 3));
};

export function familyValidation(
  family: FamilyPlan,
  veterans: Veteran[],
) {
  const result = calculateFamilyAffinity(family, veterans);
  const warnings: string[] = [];
  if (!result.target) warnings.push("Choose a target trainee.");
  if (!result.values.parent1 || !result.values.parent2)
    warnings.push("Choose both direct parents.");
  if (
    result.values.parent1 &&
    result.values.parent1 === result.values.parent2
  )
    warnings.push("Direct parents must be different identities.");
  if (
    result.target &&
    (result.target === result.values.parent1 ||
      result.target === result.values.parent2)
  )
    warnings.push("The target cannot also be a direct parent.");
  if (
    slotOrder.some(
      (key) =>
        key.startsWith("grandparent") &&
        !result.values[key as FamilySlotKey],
    )
  )
    warnings.push("Add all four grandparents for the complete calculation.");
  return warnings;
}
