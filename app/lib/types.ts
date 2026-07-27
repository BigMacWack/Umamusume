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
export type SparkStars = 1 | 2 | 3;
export type AppView =
  | "dashboard"
  | "planner"
  | "veterans"
  | "races"
  | "roster"
  | "guide"
  | "settings";

export type Spark = {
  type: string;
  stars: SparkStars;
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
  greenSpark: Spark;
  whiteSparks: Spark[];
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
  targetBlueStars: SparkStars;
  targetPink: AptitudeName;
  targetPinkStars: SparkStars;
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

export type AppSettings = {
  theme: "system" | "light" | "dark";
  density: "compact" | "comfortable";
  showRaceIcons: boolean;
  showRaceDetails: boolean;
  reduceMotion: boolean;
  confirmDeletes: boolean;
  ownedCardsFirst: boolean;
  showOnlyOwnedTargets: boolean;
  defaultRaceYear: 1 | 2 | 3;
  suggestedRouteLength: 6 | 9 | 12;
  recommendationCount: 4 | 6 | 8;
};

export type AppState = {
  version: 1;
  veterans: Veteran[];
  family: FamilyPlan;
  racePlan: RacePlan;
  ownedCardIds: number[];
  settings: AppSettings;
};

export type FamilySlotKey = keyof FamilyPlan["slots"];

export const EMPTY_SLOT: PlannerSlot = { charId: 0, veteranId: "" };
