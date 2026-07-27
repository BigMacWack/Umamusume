import assert from "node:assert/strict";
import test from "node:test";
import {
  affinityTier,
  blueStartingBonus,
  blueThreeStarChance,
  calculateFamilyAffinity,
  pairAffinity,
  startingAptitudeRanks,
} from "../app/lib/affinity";
import { cards, characters, gradedRaces } from "../app/lib/data";
import {
  nextRunSuggestions,
  suggestedG1Route,
} from "../app/lib/recommendations";
import { defaultState } from "../app/lib/storage";

test("ships the complete current Global snapshot", () => {
  assert.equal(cards.length, 93);
  assert.equal(characters.length, 62);
  assert.equal(new Set(cards.map((card) => card.cardId)).size, cards.length);
  assert.ok(cards.every((card) => card.release <= "2026-07-26"));
  assert.equal(gradedRaces.length, 214);
});

test("uses the documented affinity tier boundaries", () => {
  assert.equal(affinityTier(0).symbol, "△");
  assert.equal(affinityTier(50).symbol, "△");
  assert.equal(affinityTier(51).symbol, "○");
  assert.equal(affinityTier(150).symbol, "○");
  assert.equal(affinityTier(151).symbol, "◎");
});

test("calculates pair affinity symmetrically", () => {
  assert.equal(pairAffinity(1001, 1016), pairAffinity(1016, 1001));
  assert.equal(pairAffinity(1001, 1001), 0);
  assert.equal(pairAffinity(0, 1001), 0);
});

test("ships a distinct, calculable starter seven-character family", () => {
  const result = calculateFamilyAffinity(defaultState.family, []);
  const targetCharId = cards.find(
    (card) => card.cardId === defaultState.family.targetCardId,
  )?.charId;
  const relatives = Object.values(defaultState.family.slots).map(
    (slot) => slot.charId,
  );

  assert.ok(targetCharId);
  assert.equal(new Set(relatives).size, relatives.length);
  assert.ok(relatives.every((charId) => charId !== targetCharId));
  assert.ok(result.base > 0);
  assert.equal(result.total, result.base);
  assert.equal(result.symbol, affinityTier(result.total).symbol);
});

test("uses current blue spark thresholds and starting bonuses", () => {
  assert.deepEqual(
    [1, 2, 3].map(blueStartingBonus),
    [5, 12, 21],
  );
  assert.equal(blueThreeStarChance(599), 0);
  assert.equal(blueThreeStarChance(600), 5);
  assert.equal(blueThreeStarChance(1100), 5);
  assert.equal(blueThreeStarChance(1101), 10);
  assert.equal(startingAptitudeRanks(0), 0);
  assert.equal(startingAptitudeRanks(1), 1);
  assert.equal(startingAptitudeRanks(4), 2);
  assert.equal(startingAptitudeRanks(10), 4);
});

test("produces bounded, valid next-run and G1 route suggestions", () => {
  const targetCharId = cards.find(
    (card) => card.cardId === defaultState.family.targetCardId,
  )?.charId;
  const suggestions = nextRunSuggestions(defaultState);
  assert.equal(suggestions.length, 12);
  assert.ok(suggestions.every((suggestion) => suggestion.charId !== targetCharId));
  assert.ok(
    suggestions.every(
      (suggestion, index) =>
        index === 0 || suggestions[index - 1].score >= suggestion.score,
    ),
  );

  const route = suggestedG1Route(1001, []);
  assert.ok(route.length > 0 && route.length <= 12);
  assert.ok(route.every((race) => race.grade === "G1"));
  const turns = route.map(
    (race) => `${race.year}-${race.month}-${race.half}`,
  );
  assert.equal(new Set(turns).size, turns.length);
});
