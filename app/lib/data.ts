import {
  AFFINITY_GROUPS,
  CHARACTERS,
  GRADED_RACES,
  TRAINEE_CARDS,
} from "../data/uma-data";

export type TraineeCard = (typeof TRAINEE_CARDS)[number];
export type Character = (typeof CHARACTERS)[number];
export type GradedRace = (typeof GRADED_RACES)[number];

export const cards = [...TRAINEE_CARDS] as TraineeCard[];
export const characters = [...CHARACTERS] as Character[];
export const gradedRaces = [...GRADED_RACES] as GradedRace[];
export const affinityGroups = [...AFFINITY_GROUPS];

export const cardById = new Map<number, TraineeCard>(
  cards.map((card) => [card.cardId, card]),
);

export const characterById = new Map<number, Character>(
  characters.map((character) => [character.id, character]),
);

export const cardsByCharacter = new Map<number, TraineeCard[]>();
for (const card of cards) {
  const current = cardsByCharacter.get(card.charId) ?? [];
  current.push(card);
  cardsByCharacter.set(card.charId, current);
}

export const raceById = new Map<string, GradedRace>(
  gradedRaces.map((race) => [race.id, race]),
);

export const characterName = (charId: number) =>
  characterById.get(charId)?.name ?? "Unselected";

export const cardLabel = (card: TraineeCard) =>
  `${card.name} — ${card.outfit}`;

export const cardPortraitUrl = (card: TraineeCard) =>
  `https://gametora.com/images/umamusume/characters/chara_stand_${card.charId}_${card.cardId}.png`;

export const characterPortraitUrl = (charId: number) => {
  const card = cardsByCharacter.get(charId)?.[0];
  return card ? cardPortraitUrl(card) : "";
};

export const distanceBand = (distance: number) => {
  if (distance <= 1400) return "Short";
  if (distance <= 1800) return "Mile";
  if (distance <= 2400) return "Medium";
  return "Long";
};

export const calendarLabel = (race: GradedRace) => {
  const year = ["", "Junior", "Classic", "Senior"][race.year] ?? `Year ${race.year}`;
  return `${year} · ${race.month}/${race.half === 1 ? "Early" : "Late"}`;
};
