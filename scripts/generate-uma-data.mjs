import fs from "node:fs";
import path from "node:path";

const snapshot = "2026-07-26";
const sourceRoot =
  process.argv[2] ??
  process.env.UMA_DATA_ROOT ??
  "/workspace/scratch/365aa084c5f8";

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(sourceRoot, name), "utf8"));

const cardsRaw = readJson("gt_character_cards.json");
const charactersRaw = readJson("gt_characters.json");
const relationsRaw = readJson("gt_relation.json");
const relationMembersRaw = readJson("gt_relation_member.json");
const raceInstancesRaw = readJson("gt_race_instances.json");

const cards = cardsRaw
  .filter(
    (card) =>
      card.release_en &&
      card.release_en <= snapshot &&
      card.name_en &&
      card.title,
  )
  .map((card) => ({
    cardId: card.card_id,
    charId: card.char_id,
    name: card.name_en,
    outfit: card.title,
    rarity: card.rarity,
    release: card.release_en,
    obtained: card.obtained,
    base: card.base_stats,
    fourStar: card.four_star_stats,
    fiveStar: card.five_star_stats,
    growth: card.stat_bonus,
    aptitudes: card.aptitude,
    sourceUrl: `https://gametora.com/umamusume/characters/${card.url_name}`,
  }))
  .sort(
    (a, b) =>
      a.release.localeCompare(b.release) ||
      a.name.localeCompare(b.name) ||
      a.cardId - b.cardId,
  );

const releasedIds = new Set(cards.map((card) => card.charId));
const cardsByCharacter = new Map();
for (const card of cards) {
  const existing = cardsByCharacter.get(card.charId) ?? [];
  existing.push(card.cardId);
  cardsByCharacter.set(card.charId, existing);
}

const characterLookup = new Map(
  charactersRaw.map((character) => [character.char_id, character]),
);

const characters = [...releasedIds]
  .map((charId) => {
    const character = characterLookup.get(charId);
    const firstCard = cards.find((card) => card.charId === charId);
    return {
      id: charId,
      name: character?.en_name ?? firstCard.name,
      slug: character?.url_name ?? "",
      cardIds: cardsByCharacter.get(charId) ?? [],
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const relationPoints = new Map(
  relationsRaw.map((relation) => [
    relation.relation_type,
    relation.relation_point,
  ]),
);
const memberMap = new Map();
for (const member of relationMembersRaw) {
  if (!releasedIds.has(member.chara_id)) continue;
  const members = memberMap.get(member.relation_type) ?? [];
  members.push(member.chara_id);
  memberMap.set(member.relation_type, members);
}

const affinityGroups = [...memberMap.entries()]
  .filter(([, members]) => members.length >= 2)
  .map(([id, members]) => ({
    id,
    points: relationPoints.get(id) ?? 0,
    members: [...new Set(members)].sort((a, b) => a - b),
  }))
  .sort((a, b) => a.id - b.id);

const gradeLabels = {
  100: "G1",
  200: "G2",
  300: "G3",
};

const races = raceInstancesRaw
  .filter(
    (race) =>
      race.details?.name_en &&
      gradeLabels[race.details.grade] &&
      Number.isFinite(race.details.distance) &&
      race.details.distance < 99999,
  )
  .map((race) => ({
    id: String(race.id),
    canonicalId: String(race.id).replace(/_2$/, ""),
    name: race.details.name_en,
    year: race.year,
    month: race.month,
    half: race.half,
    grade: gradeLabels[race.details.grade],
    distance: race.details.distance,
    surface: race.details.terrain === 2 ? "Dirt" : "Turf",
  }))
  .sort(
    (a, b) =>
      a.year - b.year ||
      a.month - b.month ||
      a.half - b.half ||
      a.name.localeCompare(b.name),
  );

const output = `// Generated from GameTora's public Umamusume datasets.
// Snapshot: ${snapshot}. Run scripts/generate-uma-data.mjs with a folder
// containing the source JSON files to regenerate.

export const DATA_SNAPSHOT = ${JSON.stringify(snapshot)} as const;
export const TRAINEE_CARDS = ${JSON.stringify(cards)} as const;
export const CHARACTERS = ${JSON.stringify(characters)} as const;
export const AFFINITY_GROUPS = ${JSON.stringify(affinityGroups)} as const;
export const GRADED_RACES = ${JSON.stringify(races)} as const;
`;

const outputPath = path.join(process.cwd(), "app", "data", "uma-data.ts");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

console.log(
  JSON.stringify(
    {
      outputPath,
      cards: cards.length,
      characters: characters.length,
      affinityGroups: affinityGroups.length,
      gradedRaces: races.length,
      snapshot,
    },
    null,
    2,
  ),
);
