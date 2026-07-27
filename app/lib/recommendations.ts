import {
  calculateFamilyAffinity,
  pairAffinity,
} from "./affinity";
import {
  cardById,
  cardsByCharacter,
  characterById,
  characters,
  gradedRaces,
  raceById,
} from "./data";
import {
  APTITUDE_NAMES,
  type AppState,
  type AptitudeName,
  type FamilyPlan,
  type PlannerSlot,
  type StatName,
  type Veteran,
} from "./types";

const aptitudeValue: Record<string, number> = {
  S: 8,
  A: 7,
  B: 5,
  C: 3,
  D: 1,
  E: 0,
  F: -2,
  G: -4,
};

const statIndex: Record<StatName, number> = {
  Speed: 0,
  Stamina: 1,
  Power: 2,
  Guts: 3,
  Wit: 4,
};

const aptitudeIndex = (target: AptitudeName) =>
  APTITUDE_NAMES.indexOf(target);

const veteranSlot = (veteran: Veteran | undefined): PlannerSlot => ({
  charId: veteran?.charId ?? 0,
  veteranId: veteran?.id ?? "",
});

export function familyFromParents(
  targetCardId: number,
  first: Veteran,
  second: Veteran,
  targetBlue: StatName,
  targetPink: AptitudeName,
  veterans: Veteran[],
): FamilyPlan {
  const firstParent1 = veterans.find(
    (veteran) => veteran.id === first.parent1Id,
  );
  const firstParent2 = veterans.find(
    (veteran) => veteran.id === first.parent2Id,
  );
  const secondParent1 = veterans.find(
    (veteran) => veteran.id === second.parent1Id,
  );
  const secondParent2 = veterans.find(
    (veteran) => veteran.id === second.parent2Id,
  );

  return {
    targetCardId,
    targetBlue,
    targetPink,
    slots: {
      parent1: veteranSlot(first),
      grandparent1A: veteranSlot(firstParent1),
      grandparent1B: veteranSlot(firstParent2),
      parent2: veteranSlot(second),
      grandparent2A: veteranSlot(secondParent1),
      grandparent2B: veteranSlot(secondParent2),
    },
  };
}

export function bestSavedParentPairs(state: AppState) {
  const pairs: {
    first: Veteran;
    second: Veteran;
    score: number;
    completeLineage: boolean;
  }[] = [];

  for (let firstIndex = 0; firstIndex < state.veterans.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < state.veterans.length;
      secondIndex += 1
    ) {
      const first = state.veterans[firstIndex];
      const second = state.veterans[secondIndex];
      if (first.charId === second.charId) continue;
      const targetCharId = cardById.get(state.family.targetCardId)?.charId ?? 0;
      if (first.charId === targetCharId || second.charId === targetCharId)
        continue;

      const family = familyFromParents(
        state.family.targetCardId,
        first,
        second,
        state.family.targetBlue,
        state.family.targetPink,
        state.veterans,
      );
      const completeLineage = Boolean(
        first.parent1Id &&
          first.parent2Id &&
          second.parent1Id &&
          second.parent2Id,
      );
      const result = completeLineage
        ? calculateFamilyAffinity(family, state.veterans).total
        : pairAffinity(targetCharId, first.charId) +
          pairAffinity(targetCharId, second.charId) +
          pairAffinity(first.charId, second.charId);
      pairs.push({
        first,
        second,
        score: result,
        completeLineage,
      });
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, 8);
}

export type NextRunSuggestion = {
  charId: number;
  cardId: number;
  name: string;
  outfit: string;
  score: number;
  reasons: string[];
  suggestedRaceIds: string[];
};

export function nextRunSuggestions(state: AppState): NextRunSuggestion[] {
  const targetCard = cardById.get(state.family.targetCardId);
  const targetCharId = targetCard?.charId ?? 0;
  const existingCharacterCounts = new Map<number, number>();
  for (const veteran of state.veterans) {
    existingCharacterCounts.set(
      veteran.charId,
      (existingCharacterCounts.get(veteran.charId) ?? 0) + 1,
    );
  }

  return characters
    .filter((character) => character.id !== targetCharId)
    .map((character) => {
      const characterCards = cardsByCharacter.get(character.id) ?? [];
      const card =
        characterCards.find((candidate) =>
          state.ownedCardIds.includes(candidate.cardId),
        ) ??
        characterCards[0];
      const targetPair = pairAffinity(targetCharId, character.id);
      const supportingScores = state.veterans
        .filter((veteran) => veteran.charId !== character.id)
        .map((veteran) => pairAffinity(character.id, veteran.charId))
        .sort((a, b) => b - a)
        .slice(0, 2);
      const support =
        supportingScores.length > 0
          ? supportingScores.reduce((sum, value) => sum + value, 0) /
            supportingScores.length
          : 0;
      const growth =
        (card?.growth[statIndex[state.family.targetBlue]] ?? 0) / 2;
      const pinkIndex = aptitudeIndex(state.family.targetPink);
      const aptitude =
        aptitudeValue[card?.aptitudes[pinkIndex] ?? "G"] ?? -4;
      const diversity = existingCharacterCounts.has(character.id) ? 0 : 7;
      const score = Math.round(
        targetPair * 2.2 + support * 0.8 + growth + aptitude + diversity,
      );

      const reasons = [
        `${targetPair} fixed affinity with ${targetCard?.name ?? "the target"}`,
      ];
      if (growth >= 5)
        reasons.push(
          `${card.growth[statIndex[state.family.targetBlue]]}% ${state.family.targetBlue} growth`,
        );
      if (aptitude >= 5)
        reasons.push(
          `${card.aptitudes[pinkIndex]} ${state.family.targetPink} aptitude`,
        );
      if (diversity)
        reasons.push("adds a new identity to your saved veteran pool");
      if (supportingScores.length)
        reasons.push(
          `${Math.round(support)} average affinity with your best saved links`,
        );

      return {
        charId: character.id,
        cardId: card.cardId,
        name: character.name,
        outfit: card.outfit,
        score,
        reasons,
        suggestedRaceIds: suggestedG1Route(
          character.id,
          state.veterans,
        ).map((race) => race.id),
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 12);
}

const distanceAptitudeIndex = (distance: number) => {
  if (distance <= 1400) return 2;
  if (distance <= 1800) return 3;
  if (distance <= 2400) return 4;
  return 5;
};

export function suggestedG1Route(charId: number, veterans: Veteran[]) {
  const card = cardsByCharacter.get(charId)?.[0];
  if (!card) return [];

  const commonRaceNames = new Map<string, number>();
  for (const veteran of veterans) {
    for (const raceId of veteran.raceIds) {
      const raceName = raceById.get(raceId)?.name;
      if (raceName)
        commonRaceNames.set(
          raceName,
          (commonRaceNames.get(raceName) ?? 0) + 1,
        );
    }
  }

  const candidates = gradedRaces
    .filter((race) => {
      if (race.grade !== "G1") return false;
      const surfaceIndex = race.surface === "Dirt" ? 1 : 0;
      const surface = aptitudeValue[card.aptitudes[surfaceIndex]] ?? -4;
      const distance =
        aptitudeValue[card.aptitudes[distanceAptitudeIndex(race.distance)]] ??
        -4;
      return surface >= 3 && distance >= 3;
    })
    .map((race) => ({
      race,
      score:
        (commonRaceNames.get(race.name) ?? 0) * 12 +
        (aptitudeValue[
          card.aptitudes[distanceAptitudeIndex(race.distance)]
        ] ?? 0) *
          2,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.race.year - b.race.year ||
        a.race.month - b.race.month ||
        a.race.half - b.race.half,
    );

  const selected: typeof gradedRaces = [];
  const usedTurns = new Set<number>();
  for (const candidate of candidates) {
    const turn =
      candidate.race.year * 24 +
      (candidate.race.month - 1) * 2 +
      candidate.race.half;
    if (usedTurns.has(turn)) continue;
    selected.push(candidate.race);
    usedTurns.add(turn);
    if (selected.length >= 12) break;
  }
  return selected.sort(
    (a, b) =>
      a.year - b.year ||
      a.month - b.month ||
      a.half - b.half ||
      a.name.localeCompare(b.name),
  );
}

export function racePlanWarnings(
  raceIds: string[],
  traineeCharId: number,
) {
  const races = raceIds
    .map((id) => raceById.get(id))
    .filter((race): race is NonNullable<typeof race> => Boolean(race))
    .sort(
      (a, b) =>
        a.year - b.year ||
        a.month - b.month ||
        a.half - b.half ||
        a.name.localeCompare(b.name),
    );
  const card = cardsByCharacter.get(traineeCharId)?.[0];
  const warnings: string[] = [];
  const turns = races.map(
    (race) =>
      race.year * 24 + (race.month - 1) * 2 + (race.half === 2 ? 1 : 0),
  );

  for (let index = 2; index < turns.length; index += 1) {
    if (
      turns[index] - turns[index - 1] === 1 &&
      turns[index - 1] - turns[index - 2] === 1
    ) {
      warnings.push(
        `Three consecutive race turns ending at ${races[index].name}; schedule recovery room.`,
      );
    }
  }

  if (card) {
    for (const race of races) {
      const surfaceIndex = race.surface === "Dirt" ? 1 : 0;
      const distanceIndex = distanceAptitudeIndex(race.distance);
      const surface = card.aptitudes[surfaceIndex];
      const distance = card.aptitudes[distanceIndex];
      if ((aptitudeValue[surface] ?? -4) < 3 || (aptitudeValue[distance] ?? -4) < 3)
        warnings.push(
          `${race.name} is a difficult fit (${surface} ${race.surface}, ${distance} distance aptitude).`,
        );
    }
  }
  return [...new Set(warnings)];
}

export const recommendationLabel = (charId: number) =>
  characterById.get(charId)?.name ?? "Unknown trainee";

