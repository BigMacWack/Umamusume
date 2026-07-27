"use client";

import { ArrowRight, CalendarDays, Check, GitBranch, Library, Repeat2, Save, Target } from "lucide-react";
import { CROWN_SETS, calculateFamilyAffinity, startingAptitudeRanks } from "../../lib/affinity";
import { cardsByCharacter, characterName, gradedRaces } from "../../lib/data";
import type { AppView, FamilyPlan, SparkStars, Veteran } from "../../lib/types";
import { Badge, Button, CharacterMark, Panel, RaceMark, SectionHeading } from "./shared";

const exampleRaceNames = [...CROWN_SETS[0].races];
const exampleRaces = exampleRaceNames
  .map((name) => gradedRaces.find((race) => race.name === name))
  .filter((race): race is NonNullable<typeof race> => Boolean(race));
const exampleRaceIds = exampleRaces.map((race) => race.id);
const exampleDate = "2026-07-27T00:00:00.000Z";

function makeVeteran(
  id: string,
  charId: number,
  nickname: string,
  blueStars: SparkStars,
  pinkStars: SparkStars,
  stamina: number,
  parent1Id = "",
  parent2Id = "",
): Veteran {
  return {
    id,
    nickname,
    cardId: cardsByCharacter.get(charId)?.[0]?.cardId ?? 0,
    charId,
    scenario: "Grand Live",
    score: 14500,
    finalStats: [950, stamina, 900, 700, 900],
    blueSpark: { type: "Stamina", stars: blueStars },
    pinkSpark: { type: "Medium", stars: pinkStars },
    greenSpark: { type: "", stars: 1 },
    whiteSparks: exampleRaceNames.map((name) => ({ type: name, stars: 1 })),
    raceIds: exampleRaceIds,
    parent1Id,
    parent2Id,
    tags: ["worked example"],
    notes: "Illustrative veteran used by the worked-example page.",
    createdAt: exampleDate,
    updatedAt: exampleDate,
  };
}

const grandparent1A = makeVeteran("example-gp-1a", 1060, "Nature GP", 2, 2, 920);
const grandparent1B = makeVeteran("example-gp-1b", 1035, "Ticket GP", 2, 2, 980);
const grandparent2A = makeVeteran("example-gp-2a", 1002, "Suzuka GP", 2, 2, 860);
const grandparent2B = makeVeteran("example-gp-2b", 1006, "Oguri GP", 2, 2, 1010);
const parent1 = makeVeteran("example-parent-1", 1016, "Brian Parent", 3, 3, 1150, grandparent1A.id, grandparent1B.id);
const parent2 = makeVeteran("example-parent-2", 1015, "Opera Parent", 3, 2, 1080, grandparent2A.id, grandparent2B.id);
const exampleVeterans = [parent1, grandparent1A, grandparent1B, parent2, grandparent2A, grandparent2B];

const exampleFamily: FamilyPlan = {
  targetCardId: 100101,
  targetBlue: "Stamina",
  targetBlueStars: 3,
  targetPink: "Medium",
  targetPinkStars: 3,
  slots: {
    parent1: { charId: parent1.charId, veteranId: parent1.id },
    grandparent1A: { charId: grandparent1A.charId, veteranId: grandparent1A.id },
    grandparent1B: { charId: grandparent1B.charId, veteranId: grandparent1B.id },
    parent2: { charId: parent2.charId, veteranId: parent2.id },
    grandparent2A: { charId: grandparent2A.charId, veteranId: grandparent2A.id },
    grandparent2B: { charId: grandparent2B.charId, veteranId: grandparent2B.id },
  },
};

const exampleAffinity = calculateFamilyAffinity(exampleFamily, exampleVeterans);
const blueStars = parent1.blueSpark.stars + parent2.blueSpark.stars;
const pinkStars = parent1.pinkSpark.stars + parent2.pinkSpark.stars;

function ExampleTrainee({ veteran, role }: { veteran: Veteran; role: string }) {
  return <article className="example-trainee-card">
    <CharacterMark charId={veteran.charId} cardId={veteran.cardId} />
    <div><small>{role}</small><strong>{characterName(veteran.charId)}</strong><span>{veteran.nickname}</span></div>
    <div className="example-factor-badges"><Badge tone="blue">Stamina {veteran.blueSpark.stars}★</Badge><Badge tone="coral">Medium {veteran.pinkSpark.stars}★</Badge></div>
  </article>;
}

export default function WorkedExampleView({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return <div className="view-stack worked-example-view">
    <Panel className="example-hero">
      <SectionHeading eyebrow="Worked example" title="From empty planner to the next parent run" description="This example uses real trainee identities and the planner's live calculation rules. The saved factors and race histories are illustrative." action={<Badge tone="mint">Medium + Stamina goal</Badge>} />
      <div className="example-hero-flow"><span>Choose a target</span><ArrowRight size={14} /><span>Save veterans</span><ArrowRight size={14} /><span>Build the family</span><ArrowRight size={14} /><span>Plan shared races</span><ArrowRight size={14} /><span>Train and repeat</span></div>
    </Panel>

    <div className="example-steps">
      <Panel className="example-step">
        <div className="example-step-number">1</div>
        <div className="example-step-heading"><Target size={18} /><div><h2>Choose what the new trainee should inherit</h2><p>Start with the trainee you plan to train and two specific factor goals.</p></div></div>
        <div className="example-target-card"><CharacterMark charId={1001} cardId={100101} size="large" /><div><small>Target trainee</small><strong>Special Week</strong><span>Special Dreamer</span></div><div><Badge tone="blue">Stamina 3★</Badge><Badge tone="coral">Medium distance 3★</Badge></div></div>
        <p className="example-explanation">The goal means each useful direct parent should ideally carry a 3★ Stamina blue factor and a 3★ Medium pink factor.</p>
      </Panel>

      <Panel className="example-step">
        <div className="example-step-number">2</div>
        <div className="example-step-heading"><Library size={18} /><div><h2>Save completed veterans with their real results</h2><p>Factors, final stats, parents, and graded wins only count when a saved veteran is selected.</p></div></div>
        <div className="example-parent-grid"><ExampleTrainee veteran={parent1} role="Saved Parent 1" /><ExampleTrainee veteran={parent2} role="Saved Parent 2" /></div>
        <div className="example-comparison-table">
          <div><span>Recorded final Stamina</span><strong>{parent1.finalStats[1]}</strong><strong>{parent2.finalStats[1]}</strong></div>
          <div><span>Matching blue factor</span><strong>{parent1.blueSpark.stars}★</strong><strong>{parent2.blueSpark.stars}★</strong></div>
          <div><span>Matching pink factor</span><strong>{parent1.pinkSpark.stars}★</strong><strong>{parent2.pinkSpark.stars}★</strong></div>
          <div><span>Shared example wins</span><strong>{parent1.raceIds.length}</strong><strong>{parent2.raceIds.length}</strong></div>
        </div>
      </Panel>

      <Panel className="example-step">
        <div className="example-step-number">3</div>
        <div className="example-step-heading"><GitBranch size={18} /><div><h2>Place the two parents and their grandparents</h2><p>The character family determines the base compatibility; saved lineages also provide race history.</p></div></div>
        <div className="example-family-tree">
          <div className="example-target-node"><CharacterMark charId={1001} cardId={100101} /><span><small>Target</small><strong>Special Week</strong></span></div>
          <div className="example-branch">
            <ExampleTrainee veteran={parent1} role="Parent 1" />
            <div className="example-grandparents"><ExampleTrainee veteran={grandparent1A} role="Grandparent 1A" /><ExampleTrainee veteran={grandparent1B} role="Grandparent 1B" /></div>
          </div>
          <div className="example-branch">
            <ExampleTrainee veteran={parent2} role="Parent 2" />
            <div className="example-grandparents"><ExampleTrainee veteran={grandparent2A} role="Grandparent 2A" /><ExampleTrainee veteran={grandparent2B} role="Grandparent 2B" /></div>
          </div>
        </div>
      </Panel>

      <Panel className="example-step">
        <div className="example-step-number">4</div>
        <div className="example-step-heading"><Check size={18} /><div><h2>Read the result as a simple equation</h2><p>Character compatibility is the base. Shared graded wins and completed crown sets are added afterward.</p></div></div>
        <div className="example-result-equation">
          <div><small>Character match</small><strong>{exampleAffinity.base}</strong></div><b>+</b>
          <div><small>Shared races</small><strong>{exampleAffinity.sharedRaceBonus}</strong></div><b>+</b>
          <div><small>Shared crowns</small><strong>{exampleAffinity.sharedCrownBonus}</strong></div><b>=</b>
          <div className="example-result-total"><small>{exampleAffinity.tier} compatibility</small><strong>{exampleAffinity.symbol} {exampleAffinity.total}</strong></div>
        </div>
        <div className="example-inheritance-preview"><div><small>Blue coverage</small><strong>{blueStars}/6★</strong><span>Both parents meet the 3★ goal</span></div><div><small>Pink coverage</small><strong>{pinkStars}/6★</strong><span>One star short of the ideal pair</span></div><div><small>Starting aptitude reference</small><strong>{startingAptitudeRanks(pinkStars)} ranks</strong><span>Based on {pinkStars} matching pink stars</span></div></div>
      </Panel>

      <Panel className="example-step">
        <div className="example-step-number">5</div>
        <div className="example-step-heading"><CalendarDays size={18} /><div><h2>Plan races that future parents can share</h2><p>Repeated graded wins improve overlap, while completing a tracked crown set adds another bonus.</p></div></div>
        <div className="example-race-route">{exampleRaces.map((race) => <div key={race.id}><RaceMark race={race} size="normal" /><span><strong>{race.name}</strong><small>{race.grade} · {race.surface} · {race.distance}m</small></span></div>)}</div>
        <p className="example-explanation">In this example, both branches record the Classic Triple Crown. The planner detects those shared races and the completed crown automatically.</p>
      </Panel>

      <Panel className="example-step example-final-step">
        <div className="example-step-number">6</div>
        <div className="example-step-heading"><Repeat2 size={18} /><div><h2>Train, save the result, and use it as the next parent</h2><p>Parent farming is a loop. Each better veteran becomes input for the following run.</p></div></div>
        <div className="example-loop"><span>Train the target</span><ArrowRight size={15} /><span>Record factors and races</span><ArrowRight size={15} /><span>Replace a weaker parent</span><ArrowRight size={15} /><span>Repeat</span></div>
        <div className="example-actions"><Button icon={Save} onClick={() => onNavigate("veterans")}>Open Veteran library</Button><Button variant="secondary" icon={GitBranch} onClick={() => onNavigate("planner")}>Open Family planner</Button><Button variant="ghost" icon={CalendarDays} onClick={() => onNavigate("races")}>Open Race planner</Button></div>
      </Panel>
    </div>
  </div>;
}
