"use client";

import { Check, GitBranch, Info, Sparkles } from "lucide-react";
import {
  blueStartingBonus,
  blueThreeStarChance,
  calculateFamilyAffinity,
  familyValidation,
  pairAffinity,
  startingAptitudeRanks,
} from "../../lib/affinity";
import { cardById, characterName } from "../../lib/data";
import { bestSavedParentPairs, familyFromParents } from "../../lib/recommendations";
import {
  STAT_NAMES,
  type AppState,
  type AptitudeName,
  type FamilySlotKey,
  type PlannerSlot,
  type SparkStars,
  type StatName,
  type Veteran,
} from "../../lib/types";
import {
  Badge,
  Button,
  CardPicker,
  CharacterMark,
  Field,
  LineageSelect,
  Panel,
  SectionHeading,
  StarSelect,
  type StateSetter,
} from "./shared";

const pinkFactorGroups: { label: string; options: AptitudeName[] }[] = [
  { label: "Surface aptitude", options: ["Turf", "Dirt"] },
  { label: "Distance aptitude", options: ["Short", "Mile", "Medium", "Long"] },
  { label: "Running-style aptitude", options: ["Front", "Pace", "Late", "End"] },
];

const aptitudeLabels: Record<AptitudeName, string> = {
  Turf: "Turf",
  Dirt: "Dirt",
  Short: "Short distance",
  Mile: "Mile distance",
  Medium: "Medium distance",
  Long: "Long distance",
  Front: "Front Runner",
  Pace: "Pace Chaser",
  Late: "Late Surger",
  End: "End Closer",
};

const slotCharacter = (slot: PlannerSlot, veterans: Veteran[]) =>
  slot.veteranId ? veterans.find((veteran) => veteran.id === slot.veteranId)?.charId ?? slot.charId : slot.charId;

const breakdownCopy = [
  ["Target with Parent 1", "Fixed compatibility between the trainee and the first direct parent."],
  ["Branch 1: Target + Parent 1 + Grandparent A", "Three-way compatibility shared by all three identities in this branch."],
  ["Branch 1: Target + Parent 1 + Grandparent B", "Three-way compatibility shared by all three identities in this branch."],
  ["Target with Parent 2", "Fixed compatibility between the trainee and the second direct parent."],
  ["Branch 2: Target + Parent 2 + Grandparent A", "Three-way compatibility shared by all three identities in this branch."],
  ["Branch 2: Target + Parent 2 + Grandparent B", "Three-way compatibility shared by all three identities in this branch."],
  ["Parent 1 with Parent 2", "Fixed compatibility between the two direct parents."],
] as const;

export default function FamilyPlannerView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const affinity = calculateFamilyAffinity(state.family, state.veterans);
  const warnings = familyValidation(state.family, state.veterans);
  const pairs = bestSavedParentPairs(state).slice(0, state.settings.recommendationCount);
  const target = cardById.get(state.family.targetCardId);
  const parents = [state.family.slots.parent1, state.family.slots.parent2]
    .map((slot) => state.veterans.find((veteran) => veteran.id === slot.veteranId))
    .filter((veteran): veteran is Veteran => Boolean(veteran));
  const blueStars = parents.filter((veteran) => veteran.blueSpark.type === state.family.targetBlue).reduce((sum, veteran) => sum + veteran.blueSpark.stars, 0);
  const pinkStars = parents.filter((veteran) => veteran.pinkSpark.type === state.family.targetPink).reduce((sum, veteran) => sum + veteran.pinkSpark.stars, 0);
  const blueGoalTotal = state.family.targetBlueStars * 2;
  const pinkGoalTotal = state.family.targetPinkStars * 2;
  const blueCoverage = Math.min(100, Math.round((blueStars / blueGoalTotal) * 100));
  const pinkCoverage = Math.min(100, Math.round((pinkStars / pinkGoalTotal) * 100));
  const bestBlueChance = parents.length ? Math.max(...parents.map((veteran) => blueThreeStarChance(veteran.finalStats[STAT_NAMES.indexOf(state.family.targetBlue)]))) : 0;
  const updateFamily = (patch: Partial<AppState["family"]>) => setState((current) => ({ ...current, family: { ...current.family, ...patch } }));
  const updateSlot = (key: FamilySlotKey, slot: PlannerSlot) => setState((current) => ({ ...current, family: { ...current.family, slots: { ...current.family.slots, [key]: slot } } }));
  const parent1Char = slotCharacter(state.family.slots.parent1, state.veterans);
  const parent2Char = slotCharacter(state.family.slots.parent2, state.veterans);
  const parent1Affinity = pairAffinity(affinity.target, parent1Char);
  const parent2Affinity = pairAffinity(affinity.target, parent2Char);

  return <div className="view-stack family-workspace">
    <Panel className="family-toolbar">
      <SectionHeading eyebrow="Lineage workspace" title="Build the family around the target" description="Choose the trainee and the exact factor levels you want, then compare saved veterans against those goals." action={<Badge tone={affinity.total >= 151 ? "mint" : affinity.total >= 51 ? "gold" : "coral"}>{affinity.symbol} {affinity.total} compatibility</Badge>} />
      <div className="family-goal-grid">
        <div className="field"><span>Target trainee</span><CardPicker value={state.family.targetCardId} onChange={(targetCardId) => updateFamily({ targetCardId })} ownedCardIds={state.ownedCardIds} ownedFirst={state.settings.ownedCardsFirst} onlyOwned={state.settings.showOnlyOwnedTargets} label="Target trainee" /></div>
        <div className="factor-goal-field"><Field label="Blue factor goal"><select aria-label="Blue factor goal" value={state.family.targetBlue} onChange={(event) => updateFamily({ targetBlue: event.target.value as StatName })}>{STAT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="Blue factor stars"><StarSelect value={state.family.targetBlueStars} onChange={(targetBlueStars: SparkStars) => updateFamily({ targetBlueStars })} label="Blue factor goal stars" /></Field></div>
        <div className="factor-goal-field"><Field label="Pink factor goal"><select aria-label="Pink factor goal" value={state.family.targetPink} onChange={(event) => updateFamily({ targetPink: event.target.value as AptitudeName })}>{pinkFactorGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.options.map((name) => <option key={name} value={name}>{aptitudeLabels[name]}</option>)}</optgroup>)}</select></Field><Field label="Pink factor stars"><StarSelect value={state.family.targetPinkStars} onChange={(targetPinkStars: SparkStars) => updateFamily({ targetPinkStars })} label="Pink factor goal stars" /></Field></div>
      </div>
    </Panel>

    <div className="family-board-v2">
      <Panel className="lineage-board-v2">
        <div className="lineage-board-title"><div><GitBranch size={16} /><strong>Seven-character family</strong></div><span>Saved veterans add their recorded factors, race overlap, and grandparents. Identity-only selections provide character compatibility only.</span></div>
        <div className="lineage-tree-v2">
          <div className="target-node-v2"><CharacterMark charId={target?.charId ?? 0} cardId={target?.cardId} size="large" /><div><small>Target trainee</small><strong>{target?.name ?? "Unselected"}</strong><span>{target?.outfit ?? "Choose a target"}</span></div><div className="target-goals-v2"><Badge tone="blue">{state.family.targetBlue} {state.family.targetBlueStars}★</Badge><Badge tone="coral">{aptitudeLabels[state.family.targetPink]} {state.family.targetPinkStars}★</Badge></div></div>
          <div className="tree-branches-v2">
            <section className="tree-branch-v2 branch-one"><div className="branch-heading-v2"><span>Parent branch 1</span><Badge tone={parent1Affinity >= 26 ? "mint" : "neutral"}>{parent1Affinity} with target</Badge></div><LineageSelect label="Parent 1" slot={state.family.slots.parent1} veterans={state.veterans} onChange={(slot) => updateSlot("parent1", slot)} /><div className="grandparent-row-v2"><LineageSelect label="Grandparent 1A" slot={state.family.slots.grandparent1A} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent1A", slot)} /><LineageSelect label="Grandparent 1B" slot={state.family.slots.grandparent1B} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent1B", slot)} /></div></section>
            <section className="tree-branch-v2 branch-two"><div className="branch-heading-v2"><span>Parent branch 2</span><Badge tone={parent2Affinity >= 26 ? "mint" : "neutral"}>{parent2Affinity} with target</Badge></div><LineageSelect label="Parent 2" slot={state.family.slots.parent2} veterans={state.veterans} onChange={(slot) => updateSlot("parent2", slot)} /><div className="grandparent-row-v2"><LineageSelect label="Grandparent 2A" slot={state.family.slots.grandparent2A} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent2A", slot)} /><LineageSelect label="Grandparent 2B" slot={state.family.slots.grandparent2B} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent2B", slot)} /></div></section>
          </div>
        </div>
        {warnings.length ? <div className="notice-list family-validation-v2">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="success-note family-validation-v2"><Check size={14} /> Family structure is valid.</div>}
      </Panel>

      <aside className="family-rail-v2">
        <Panel className="affinity-card-v2 compatibility-card-v3">
          <SectionHeading title="Compatibility result" description="The final score combines the character family with bonuses from saved race histories." />
          <div className={`compatibility-total-v3 tone-${affinity.tone}`}>
            <span>Overall compatibility</span>
            <strong><b>{affinity.symbol}</b>{affinity.total}</strong>
            <small>{affinity.tier} tier{affinity.next ? ` · ${affinity.next} points to the next tier` : " · highest tier reached"}</small>
          </div>
          <div className="compatibility-contributions-v3" aria-label="Compatibility score contributions">
            <div><span>Character match score</span><strong>{affinity.base}</strong><small>Target, direct parents, and grandparents</small></div>
            <div><span>Shared race bonus</span><strong>+{affinity.sharedRaceBonus}</strong><small>Overlapping graded wins in saved lineages</small></div>
            <div><span>Shared crown bonus</span><strong>+{affinity.sharedCrownBonus}</strong><small>Completed crown sets shared along parent links</small></div>
          </div>
          <div className="compatibility-equation-v3" aria-label={`${affinity.base} plus ${affinity.sharedRaceBonus} plus ${affinity.sharedCrownBonus} equals ${affinity.total}`}><span>{affinity.base}</span><b>+</b><span>{affinity.sharedRaceBonus}</span><b>+</b><span>{affinity.sharedCrownBonus}</span><b>=</b><strong>{affinity.total}</strong></div>
          <details className="breakdown-details-v2" open={state.settings.showRaceDetails}><summary>Show character-match calculation</summary><div className="affinity-explanation-list">{affinity.breakdown.map((item, index) => <div key={item.label}><span><strong>{breakdownCopy[index]?.[0] ?? item.label}</strong><small>{breakdownCopy[index]?.[1]}</small></span><b>+{item.value}</b></div>)}</div></details>
        </Panel>

        <Panel className="quick-pairs-v2">
          <SectionHeading title="Recommended saved parent pairs" description="Ranked by compatibility, matching factor types and star levels, recorded grandparents, and shared wins." />
          <div className="breeding-pair-list">{pairs.length ? pairs.map((pair, index) => <article className="breeding-pair-card" key={`${pair.first.id}-${pair.second.id}`}>
            <div className="breeding-pair-rank">#{index + 1}</div><div className="pair-identities"><CharacterMark charId={pair.first.charId} cardId={pair.first.cardId} size="small" /><span>{pair.first.nickname || characterName(pair.first.charId)}</span><span>+</span><CharacterMark charId={pair.second.charId} cardId={pair.second.cardId} size="small" /><span>{pair.second.nickname || characterName(pair.second.charId)}</span></div>
            <div className="breeding-pair-scores"><Badge tone={pair.completeLineage ? "mint" : "neutral"}>{pair.affinity} compatibility</Badge>{pair.factorScore ? <Badge tone="blue">+{pair.factorScore} factor fit</Badge> : null}</div>
            <ul>{pair.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul>
            <Button variant="secondary" onClick={() => setState((current) => ({ ...current, family: familyFromParents(current.family.targetCardId, pair.first, pair.second, current.family.targetBlue, current.family.targetPink, current.veterans, current.family.targetBlueStars, current.family.targetPinkStars) }))}>Use this pair</Button>
          </article>) : <p className="empty-state">Save at least two different veterans to receive parent-pair recommendations.</p>}</div>
        </Panel>
      </aside>
    </div>

    <Panel className="inheritance-panel-v3">
      <div className="inheritance-heading-v3">
        <SectionHeading eyebrow="Direct-parent preview" title="Inheritance goals and parent coverage" description="This compares the factors recorded on Parent 1 and Parent 2 with the goals selected above." action={<Sparkles size={17} />} />
        <span className={`parent-source-status ${parents.length === 2 ? "complete" : "incomplete"}`}><strong>{parents.length}/2</strong> saved direct parents</span>
      </div>
      <div className="inheritance-goals-v3">
        <div><small>Blue goal on each parent</small><Badge tone="blue">{state.family.targetBlue} {state.family.targetBlueStars}★</Badge></div>
        <div><small>Pink goal on each parent</small><Badge tone="coral">{aptitudeLabels[state.family.targetPink]} {state.family.targetPinkStars}★</Badge></div>
      </div>
      {parents.length < 2 ? <div className="affinity-help inheritance-source-note"><Info size={15} /><p><strong>Values are incomplete:</strong> identity-only selections have no saved factors or final stats. Choose saved veterans in both direct-parent slots to fill this preview.</p></div> : null}
      <div className="inheritance-metrics-v3">
        <article>
          <div className="inheritance-metric-heading"><span>Blue factor coverage</span><strong>{blueStars}/{blueGoalTotal}★</strong></div>
          <div className="coverage-track" aria-label={`${blueCoverage}% blue factor coverage`}><span style={{ width: `${blueCoverage}%` }} /></div>
          <p>Matching {state.family.targetBlue.toLowerCase()} stars across both direct parents.</p>
          <small>Reference starting bonus: up to +{blueStartingBonus(Math.min(3, blueStars))} per inherited activation.</small>
        </article>
        <article>
          <div className="inheritance-metric-heading"><span>Pink factor coverage</span><strong>{pinkStars}/{pinkGoalTotal}★</strong></div>
          <div className="coverage-track coverage-pink" aria-label={`${pinkCoverage}% pink factor coverage`}><span style={{ width: `${pinkCoverage}%` }} /></div>
          <p>Matching {aptitudeLabels[state.family.targetPink].toLowerCase()} stars across both direct parents.</p>
          <small>Reference effect: up to {startingAptitudeRanks(pinkStars)} starting aptitude rank increases.</small>
        </article>
        <article className="roll-reference-card">
          <div className="inheritance-metric-heading"><span>3★ blue-factor roll reference</span><strong>{bestBlueChance}%</strong></div>
          <p>Uses the higher recorded final {state.family.targetBlue.toLowerCase()} stat from the two saved direct parents.</p>
          <small>Below 600: 0% · 600–1100: 5% · above 1100: 10%</small>
        </article>
      </div>
    </Panel>
  </div>;
}
