import type { AppState } from "./types";

export const STORAGE_KEY = "uma-parent-planner:v1";

export const defaultState: AppState = {
  version: 1,
  veterans: [],
  ownedCardIds: [],
  family: {
    targetCardId: 100101,
    targetBlue: "Stamina",
    targetPink: "Medium",
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

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 1) return defaultState;
    return {
      ...defaultState,
      ...parsed,
      family: {
        ...defaultState.family,
        ...parsed.family,
        slots: {
          ...defaultState.family.slots,
          ...parsed.family?.slots,
        },
      },
      racePlan: { ...defaultState.racePlan, ...parsed.racePlan },
    };
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
  anchor.download = `umamusume-parent-planner-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<AppState> {
  const parsed = JSON.parse(await file.text()) as AppState;
  if (parsed.version !== 1 || !Array.isArray(parsed.veterans)) {
    throw new Error("This is not a valid Umamusume Parent Planner backup.");
  }
  return parsed;
}
