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
  APTITUDE_NAMES,
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
  AffinityMeter,
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
        <div className="factor-goal-field"><Field label="Blue factor goal"><select value={state.family.targetBlue} onChange={(event) => updateFamily({ targetBlue: event.target.value as StatName })}>{STAT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="Stars"><StarSelect value={state.family.targetBlueStars} onChange={(targetBlueStars: SparkStars) => updateFamily({ targetBlueStars })} label="Blue factor goal stars" /></Field></div>
        <div className="factor-goal-field"><Field label="Pink factor goal"><select value={state.family.targetPink} onChange={(event) => updateFamily({ targetPink: event.target.value as AptitudeName })}>{APTITUDE_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="Stars"><StarSelect value={state.family.targetPinkStars} onChange={(targetPinkStars: SparkStars) => updateFamily({ targetPinkStars })} label="Pink factor goal stars" /></Field></div>
      </div>
    </Panel>

    <div className="family-board-v2">
      <Panel className="lineage-board-v2">
        <div className="lineage-board-title"><div><GitBranch size={16} /><strong>Seven-character family</strong></div><span>Saved veterans add their recorded factors, race overlap, and grandparents. Identity-only selections provide character compatibility only.</span></div>
        <div className="lineage-tree-v2">
          <div className="target-node-v2"><CharacterMark charId={target?.charId ?? 0} cardId={target?.cardId} size="large" /><div><small>Target trainee</small><strong>{target?.name ?? "Unselected"}</strong><span>{target?.outfit ?? "Choose a target"}</span></div><div className="target-goals-v2"><Badge tone="blue">{state.family.targetBlue} {state.family.targetBlueStars}★</Badge><Badge tone="coral">{state.family.targetPink} {state.family.targetPinkStars}★</Badge></div></div>
          <div className="tree-branches-v2">
            <section className="tree-branch-v2 branch-one"><div className="branch-heading-v2"><span>Parent branch 1</span><Badge tone={parent1Affinity >= 26 ? "mint" : "neutral"}>{parent1Affinity} with target</Badge></div><LineageSelect label="Parent 1" slot={state.family.slots.parent1} veterans={state.veterans} onChange={(slot) => updateSlot("parent1", slot)} /><div className="grandparent-row-v2"><LineageSelect label="Grandparent 1A" slot={state.family.slots.grandparent1A} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent1A", slot)} /><LineageSelect label="Grandparent 1B" slot={state.family.slots.grandparent1B} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent1B", slot)} /></div></section>
            <section className="tree-branch-v2 branch-two"><div className="branch-heading-v2"><span>Parent branch 2</span><Badge tone={parent2Affinity >= 26 ? "mint" : "neutral"}>{parent2Affinity} with target</Badge></div><LineageSelect label="Parent 2" slot={state.family.slots.parent2} veterans={state.veterans} onChange={(slot) => updateSlot("parent2", slot)} /><div className="grandparent-row-v2"><LineageSelect label="Grandparent 2A" slot={state.family.slots.grandparent2A} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent2A", slot)} /><LineageSelect label="Grandparent 2B" slot={state.family.slots.grandparent2B} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent2B", slot)} /></div></section>
          </div>
        </div>
        {warnings.length ? <div className="notice-list family-validation-v2">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="success-note family-validation-v2"><Check size={14} /> Family structure is valid.</div>}
      </Panel>

      <aside className="family-rail-v2">
        <Panel className="affinity-card-v2">
          <SectionHeading title="Compatibility result" />
          <AffinityMeter score={affinity.total} symbol={affinity.symbol} tier={affinity.tier} />
          <div className="affinity-help"><Info size={15} /><p><strong>What this number means:</strong> character identities provide fixed pair and three-way compatibility. When a slot uses a saved veteran, shared graded wins and completed crown sets are added along the five parent links. Factor stars affect inheritance quality and recommendations, but do not change this compatibility number.</p></div>
          <div className="affinity-summary-v2"><div><span>Fixed character compatibility</span><strong>{affinity.base}</strong></div><div><span>Shared graded-race overlap</span><strong>+{affinity.sharedRaceBonus}</strong></div><div><span>Shared completed crown sets</span><strong>+{affinity.sharedCrownBonus}</strong></div><div className="result-total"><span>Total</span><strong>{affinity.total}</strong></div></div>
          <details className="breakdown-details-v2" open={state.settings.showRaceDetails}><summary>How the fixed compatibility was built</summary><div className="affinity-explanation-list">{affinity.breakdown.map((item, index) => <div key={item.label}><span><strong>{breakdownCopy[index]?.[0] ?? item.label}</strong><small>{breakdownCopy[index]?.[1]}</small></span><b>+{item.value}</b></div>)}</div></details>
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

    <Panel className="inheritance-strip-v2">
      <SectionHeading eyebrow="Inheritance reference" title="What the selected direct parents contribute" description={`Your goal is ${state.family.targetBlue} ${state.family.targetBlueStars}★ and ${state.family.targetPink} ${state.family.targetPinkStars}★ on each useful parent. The totals below combine both direct parents.`} action={<Sparkles size={17} />} />
      <div className="compact-stat-grid">
        <div><small>Matching blue stars</small><strong>{blueStars}★</strong><span>Up to +{blueStartingBonus(Math.min(3, blueStars))} starting {state.family.targetBlue.toLowerCase()} per inherited factor activation</span></div>
        <div><small>Matching pink stars</small><strong>{pinkStars}★</strong><span>Up to {startingAptitudeRanks(pinkStars)} starting aptitude rank increases across inheritance events</span></div>
        <div><small>Best 3★ blue roll reference</small><strong>{parents.length ? Math.max(...parents.map((veteran) => blueThreeStarChance(veteran.finalStats[STAT_NAMES.indexOf(state.family.targetBlue)]))) : 0}%</strong><span>Reference based on the highest recorded target stat among the direct parents</span></div>
      </div>
    </Panel>
  </div>;
}
