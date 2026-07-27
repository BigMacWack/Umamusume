import type { AppSettings, AppState, Spark, SparkStars, Veteran } from "./types";

export const STORAGE_KEY = "uma-parent-planner:v1";

export const defaultSettings: AppSettings = {
  theme: "system",
  density: "compact",
  showRaceIcons: true,
  showRaceDetails: true,
  reduceMotion: false,
  confirmDeletes: true,
  ownedCardsFirst: true,
  showOnlyOwnedTargets: false,
  defaultRaceYear: 2,
  suggestedRouteLength: 12,
  recommendationCount: 6,
};

export const defaultState: AppState = {
  version: 1,
  veterans: [],
  ownedCardIds: [],
  settings: defaultSettings,
  family: {
    targetCardId: 100101,
    targetBlue: "Stamina",
    targetBlueStars: 3,
    targetPink: "Medium",
    targetPinkStars: 3,
    slots: {
      parent1: { charId: 1016, veteranId: "" },
      grandparent1A: { charId: 1060, veteranId: "" },
      grandparent1B: { charId: 1035, veteranId: "" },
      parent2: { charId: 1060, veteranId: "" },
      grandparent2A: { charId: 1016, veteranId: "" },
      grandparent2B: { charId: 1015, veteranId: "" },
    },
  },
  racePlan: {
    traineeCharId: 1001,
    raceIds: [],
    name: "Next parent run",
  },
};

const stars = (value: unknown, fallback: SparkStars = 1): SparkStars =>
  value === 2 || value === 3 ? value : value === 1 ? 1 : fallback;

const spark = (value: unknown, fallbackType = "", fallbackStars: SparkStars = 1): Spark => {
  if (typeof value === "object" && value !== null) {
    const candidate = value as Partial<Spark>;
    return {
      type: typeof candidate.type === "string" ? candidate.type : fallbackType,
      stars: stars(candidate.stars, fallbackStars),
    };
  }
  if (typeof value === "string") return { type: value, stars: fallbackStars };
  return { type: fallbackType, stars: fallbackStars };
};

const normalizeVeteran = (value: unknown): Veteran | null => {
  if (typeof value !== "object" || value === null) return null;
  const veteran = value as Partial<Veteran> & {
    greenSkill?: unknown;
    greenSkillStars?: unknown;
    whiteSparks?: unknown[];
  };
  if (typeof veteran.id !== "string") return null;
  return {
    id: veteran.id,
    nickname: typeof veteran.nickname === "string" ? veteran.nickname : "",
    cardId: Number(veteran.cardId) || 0,
    charId: Number(veteran.charId) || 0,
    scenario: typeof veteran.scenario === "string" ? veteran.scenario : "Grand Live",
    score: typeof veteran.score === "number" ? veteran.score : null,
    finalStats: Array.isArray(veteran.finalStats)
      ? ([0, 1, 2, 3, 4].map((index) => Number(veteran.finalStats?.[index]) || 0) as Veteran["finalStats"])
      : [0, 0, 0, 0, 0],
    blueSpark: spark(veteran.blueSpark, "Stamina", 3),
    pinkSpark: spark(veteran.pinkSpark, "Medium", 3),
    greenSpark: spark(
      veteran.greenSpark ?? veteran.greenSkill,
      typeof veteran.greenSkill === "string" ? veteran.greenSkill : "",
      stars(veteran.greenSkillStars, 1),
    ),
    whiteSparks: Array.isArray(veteran.whiteSparks)
      ? veteran.whiteSparks.map((item) => spark(item)).filter((item) => item.type)
      : [],
    raceIds: Array.isArray(veteran.raceIds) ? veteran.raceIds.filter((id): id is string => typeof id === "string") : [],
    parent1Id: typeof veteran.parent1Id === "string" ? veteran.parent1Id : "",
    parent2Id: typeof veteran.parent2Id === "string" ? veteran.parent2Id : "",
    tags: Array.isArray(veteran.tags) ? veteran.tags.filter((tag): tag is string => typeof tag === "string") : [],
    notes: typeof veteran.notes === "string" ? veteran.notes : "",
    createdAt: typeof veteran.createdAt === "string" ? veteran.createdAt : new Date().toISOString(),
    updatedAt: typeof veteran.updatedAt === "string" ? veteran.updatedAt : new Date().toISOString(),
  };
};

export function normalizeState(value: unknown): AppState {
  if (typeof value !== "object" || value === null) return defaultState;
  const parsed = value as Partial<AppState>;
  const family = parsed.family ?? defaultState.family;
  return {
    ...defaultState,
    ...parsed,
    version: 1,
    veterans: Array.isArray(parsed.veterans)
      ? parsed.veterans.map(normalizeVeteran).filter((veteran): veteran is Veteran => Boolean(veteran))
      : [],
    ownedCardIds: Array.isArray(parsed.ownedCardIds)
      ? parsed.ownedCardIds.map(Number).filter(Number.isFinite)
      : [],
    settings: { ...defaultSettings, ...parsed.settings },
    family: {
      ...defaultState.family,
      ...family,
      targetBlueStars: stars(family.targetBlueStars, 3),
      targetPinkStars: stars(family.targetPinkStars, 3),
      slots: {
        ...defaultState.family.slots,
        ...family.slots,
      },
    },
    racePlan: { ...defaultState.racePlan, ...parsed.racePlan },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState;
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function downloadBackup(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `umamusume-parent-planner-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<AppState> {
  const parsed = JSON.parse(await file.text()) as Partial<AppState>;
  if (!Array.isArray(parsed.veterans)) {
    throw new Error("This is not a valid Umamusume Parent Planner backup.");
  }
  return normalizeState(parsed);
}
