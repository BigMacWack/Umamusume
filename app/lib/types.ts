export const STAT_NAMES = [
  "Speed",
  "Stamina",
  "Power",
  "Guts",
  "Wit",
] as const;

export const APTITUDE_NAMES = [
  "Turf",
  "Dirt",
  "Short",
  "Mile",
  "Medium",
  "Long",
  "Front",
  "Pace",
  "Late",
  "End",
] as const;

export type StatName = (typeof STAT_NAMES)[number];
export type AptitudeName = (typeof APTITUDE_NAMES)[number];
export type AppView =
  | "dashboard"
  | "planner"
  | "veterans"
  | "races"
  | "roster"
  | "guide";

export type Spark = {
  type: string;
  stars: 1 | 2 | 3;
};

export type Veteran = {
  id: string;
  nickname: string;
  cardId: number;
  charId: number;
  scenario: string;
  score: number | null;
  finalStats: [number, number, number, number, number];
  blueSpark: Spark;
  pinkSpark: Spark;
  greenSkill: string;
  whiteSparks: string[];
  raceIds: string[];
  parent1Id: string;
  parent2Id: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PlannerSlot = {
  charId: number;
  veteranId: string;
};

export type FamilyPlan = {
  targetCardId: number;
  targetBlue: StatName;
  targetPink: AptitudeName;
  slots: {
    parent1: PlannerSlot;
    grandparent1A: PlannerSlot;
    grandparent1B: PlannerSlot;
    parent2: PlannerSlot;
    grandparent2A: PlannerSlot;
    grandparent2B: PlannerSlot;
  };
};

export type RacePlan = {
  traineeCharId: number;
  raceIds: string[];
  name: string;
};

export type AppState = {
  version: 1;
  veterans: Veteran[];
  family: FamilyPlan;
  racePlan: RacePlan;
  ownedCardIds: number[];
};

export type FamilySlotKey = keyof FamilyPlan["slots"];

export const EMPTY_SLOT: PlannerSlot = { charId: 0, veteranId: "" };
