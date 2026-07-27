import { calculateFamilyAffinity, pairAffinity } from "./affinity";
import {
  cardById,
  cardsByCharacter,
  characterById,
  characters,
  gradedRaces,
  raceById,
  turnKey,
} from "./data";
import {
  APTITUDE_NAMES,
  type AppState,
  type AptitudeName,
  type FamilyPlan,
  type PlannerSlot,
  type SparkStars,
  type StatName,
  type Veteran,
} from "./types";

const aptitudeValue: Record<string, number> = {
  S: 8, A: 7, B: 5, C: 3, D: 1, E: 0, F: -2, G: -4,
};

const statIndex: Record<StatName, number> = {
  Speed: 0, Stamina: 1, Power: 2, Guts: 3, Wit: 4,
};

const aptitudeIndex = (target: AptitudeName) => APTITUDE_NAMES.indexOf(target);
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
  targetBlueStars: SparkStars = 3,
  targetPinkStars: SparkStars = 3,
): FamilyPlan {
  const firstParent1 = veterans.find((veteran) => veteran.id === first.parent1Id);
  const firstParent2 = veterans.find((veteran) => veteran.id === first.parent2Id);
  const secondParent1 = veterans.find((veteran) => veteran.id === second.parent1Id);
  const secondParent2 = veterans.find((veteran) => veteran.id === second.parent2Id);
  return {
    targetCardId,
    targetBlue,
    targetBlueStars,
    targetPink,
    targetPinkStars,
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

const factorScore = (veteran: Veteran, state: AppState) => {
  let score = 0;
  const reasons: string[] = [];
  if (veteran.blueSpark.type === state.family.targetBlue) {
    score += veteran.blueSpark.stars * 5;
    if (veteran.blueSpark.stars >= state.family.targetBlueStars) score += 5;
    reasons.push(`${veteran.blueSpark.type} ${veteran.blueSpark.stars}★ blue`);
  }
  if (veteran.pinkSpark.type === state.family.targetPink) {
    score += veteran.pinkSpark.stars * 4;
    if (veteran.pinkSpark.stars >= state.family.targetPinkStars) score += 4;
    reasons.push(`${veteran.pinkSpark.type} ${veteran.pinkSpark.stars}★ pink`);
  }
  if (veteran.greenSpark.type) score += veteran.greenSpark.stars;
  score += veteran.whiteSparks.reduce((sum, spark) => sum + spark.stars, 0) * 0.35;
  return { score, reasons };
};

export type SavedParentPairRecommendation = {
  first: Veteran;
  second: Veteran;
  score: number;
  affinity: number;
  factorScore: number;
  completeLineage: boolean;
  reasons: string[];
};

export function bestSavedParentPairs(state: AppState): SavedParentPairRecommendation[] {
  const pairs: SavedParentPairRecommendation[] = [];
  const targetCharId = cardById.get(state.family.targetCardId)?.charId ?? 0;
  for (let firstIndex = 0; firstIndex < state.veterans.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < state.veterans.length; secondIndex += 1) {
      const first = state.veterans[firstIndex];
      const second = state.veterans[secondIndex];
      if (first.charId === second.charId || first.charId === targetCharId || second.charId === targetCharId) continue;
      const family = familyFromParents(
        state.family.targetCardId,
        first,
        second,
        state.family.targetBlue,
        state.family.targetPink,
        state.veterans,
        state.family.targetBlueStars,
        state.family.targetPinkStars,
      );
      const completeLineage = Boolean(first.parent1Id && first.parent2Id && second.parent1Id && second.parent2Id);
      const affinity = completeLineage
        ? calculateFamilyAffinity(family, state.veterans).total
        : pairAffinity(targetCharId, first.charId) + pairAffinity(targetCharId, second.charId) + pairAffinity(first.charId, second.charId);
      const firstFactors = factorScore(first, state);
      const secondFactors = factorScore(second, state);
      const combinedFactorScore = Math.round(firstFactors.score + secondFactors.score);
      const sharedWins = first.raceIds.filter((id) => second.raceIds.some((otherId) => raceById.get(otherId)?.name === raceById.get(id)?.name)).length;
      const reasons = [
        `${affinity} estimated family compatibility`,
        ...firstFactors.reasons.map((reason) => `${first.nickname || characterById.get(first.charId)?.name}: ${reason}`),
        ...secondFactors.reasons.map((reason) => `${second.nickname || characterById.get(second.charId)?.name}: ${reason}`),
      ];
      if (completeLineage) reasons.push("all four grandparents are recorded");
      if (sharedWins) reasons.push(`${sharedWins} shared graded win${sharedWins === 1 ? "" : "s"}`);
      if (!firstFactors.reasons.length && !secondFactors.reasons.length) reasons.push("strong compatibility, but neither parent matches the current factor goals");
      pairs.push({
        first,
        second,
        affinity,
        factorScore: combinedFactorScore,
        completeLineage,
        reasons,
        score: affinity + combinedFactorScore + (completeLineage ? 8 : 0),
      });
    }
  }
  return pairs.sort((a, b) => b.score - a.score || b.affinity - a.affinity).slice(0, 12);
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
  for (const veteran of state.veterans) existingCharacterCounts.set(veteran.charId, (existingCharacterCounts.get(veteran.charId) ?? 0) + 1);

  return characters
    .filter((character) => character.id !== targetCharId)
    .map((character) => {
      const characterCards = cardsByCharacter.get(character.id) ?? [];
      const card = characterCards.find((candidate) => state.ownedCardIds.includes(candidate.cardId)) ?? characterCards[0];
      const targetPair = pairAffinity(targetCharId, character.id);
      const supportingScores = state.veterans
        .filter((veteran) => veteran.charId !== character.id)
        .map((veteran) => pairAffinity(character.id, veteran.charId))
        .sort((a, b) => b - a)
        .slice(0, 2);
      const support = supportingScores.length ? supportingScores.reduce((sum, value) => sum + value, 0) / supportingScores.length : 0;
      const growth = (card?.growth[statIndex[state.family.targetBlue]] ?? 0) / 2;
      const pinkIndex = aptitudeIndex(state.family.targetPink);
      const aptitude = aptitudeValue[card?.aptitudes[pinkIndex] ?? "G"] ?? -4;
      const diversity = existingCharacterCounts.has(character.id) ? 0 : 7;
      const score = Math.round(targetPair * 2.2 + support * 0.8 + growth + aptitude + diversity);
      const reasons = [`${targetPair} fixed compatibility with ${targetCard?.name ?? "the target"}`];
      if (growth >= 5) reasons.push(`${card.growth[statIndex[state.family.targetBlue]]}% ${state.family.targetBlue} growth`);
      if (aptitude >= 5) reasons.push(`${card.aptitudes[pinkIndex]} ${state.family.targetPink} aptitude`);
      if (diversity) reasons.push("adds a new identity to your saved veteran pool");
      if (supportingScores.length) reasons.push(`${Math.round(support)} average compatibility with the best saved links`);
      return {
        charId: character.id,
        cardId: card.cardId,
        name: character.name,
        outfit: card.outfit,
        score,
        reasons,
        suggestedRaceIds: suggestedG1Route(character.id, state.veterans, state.settings.suggestedRouteLength).map((race) => race.id),
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

export function suggestedG1Route(charId: number, veterans: Veteran[], maxRaces = 12) {
  const card = cardsByCharacter.get(charId)?.[0];
  if (!card) return [];
  const commonRaceNames = new Map<string, number>();
  for (const veteran of veterans) {
    for (const raceId of veteran.raceIds) {
      const raceName = raceById.get(raceId)?.name;
      if (raceName) commonRaceNames.set(raceName, (commonRaceNames.get(raceName) ?? 0) + 1);
    }
  }
  const candidates = gradedRaces
    .filter((race) => {
      if (race.grade !== "G1") return false;
      const surfaceIndex = race.surface === "Dirt" ? 1 : 0;
      return (aptitudeValue[card.aptitudes[surfaceIndex]] ?? -4) >= 3 && (aptitudeValue[card.aptitudes[distanceAptitudeIndex(race.distance)]] ?? -4) >= 3;
    })
    .map((race) => ({
      race,
      score: (commonRaceNames.get(race.name) ?? 0) * 12 + (aptitudeValue[card.aptitudes[distanceAptitudeIndex(race.distance)]] ?? 0) * 2,
    }))
    .sort((a, b) => b.score - a.score || a.race.year - b.race.year || a.race.month - b.race.month || a.race.half - b.race.half);
  const selected: typeof gradedRaces = [];
  const usedTurns = new Set<string>();
  for (const candidate of candidates) {
    const key = turnKey(candidate.race);
    if (usedTurns.has(key)) continue;
    selected.push(candidate.race);
    usedTurns.add(key);
    if (selected.length >= maxRaces) break;
  }
  return selected.sort((a, b) => a.year - b.year || a.month - b.month || a.half - b.half || a.name.localeCompare(b.name));
}

export function racePlanWarnings(raceIds: string[], traineeCharId: number) {
  const races = raceIds
    .map((id) => raceById.get(id))
    .filter((race): race is NonNullable<typeof race> => Boolean(race))
    .sort((a, b) => a.year - b.year || a.month - b.month || a.half - b.half || a.name.localeCompare(b.name));
  const card = cardsByCharacter.get(traineeCharId)?.[0];
  const warnings: string[] = [];
  const turnCounts = new Map<string, number>();
  for (const race of races) turnCounts.set(turnKey(race), (turnCounts.get(turnKey(race)) ?? 0) + 1);
  if ([...turnCounts.values()].some((count) => count > 1)) warnings.push("More than one race is selected on the same turn; only one can be run.");
  const turns = races.map((race) => race.year * 24 + (race.month - 1) * 2 + (race.half === 2 ? 1 : 0));
  for (let index = 2; index < turns.length; index += 1) {
    if (turns[index] - turns[index - 1] === 1 && turns[index - 1] - turns[index - 2] === 1) warnings.push(`Three consecutive race turns ending at ${races[index].name}; leave room to recover.`);
  }
  if (card) {
    for (const race of races) {
      const surface = card.aptitudes[race.surface === "Dirt" ? 1 : 0];
      const distance = card.aptitudes[distanceAptitudeIndex(race.distance)];
      if ((aptitudeValue[surface] ?? -4) < 3 || (aptitudeValue[distance] ?? -4) < 3) warnings.push(`${race.name} is a difficult fit (${surface} ${race.surface}, ${distance} distance aptitude).`);
    }
  }
  return [...new Set(warnings)];
}

export const recommendationLabel = (charId: number) => characterById.get(charId)?.name ?? "Unknown trainee";
