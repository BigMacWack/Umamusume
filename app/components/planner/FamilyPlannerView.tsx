"use client";

import { Check, GitBranch, Sparkles } from "lucide-react";
import {
  blueStartingBonus,
  blueThreeStarChance,
  calculateFamilyAffinity,
  familyValidation,
  pairAffinity,
  startingAptitudeRanks,
} from "../../lib/affinity";
import { cardById, cardLabel, cards, characterName } from "../../lib/data";
import { bestSavedParentPairs, familyFromParents } from "../../lib/recommendations";
import {
  APTITUDE_NAMES,
  STAT_NAMES,
  type AppState,
  type AptitudeName,
  type FamilySlotKey,
  type PlannerSlot,
  type StatName,
  type Veteran,
} from "../../lib/types";
import {
  AffinityMeter,
  Badge,
  Button,
  CharacterMark,
  Field,
  LineageSelect,
  Panel,
  SectionHeading,
  type StateSetter,
} from "./shared";

const slotCharacter = (slot: PlannerSlot, veterans: Veteran[]) =>
  slot.veteranId
    ? veterans.find((veteran) => veteran.id === slot.veteranId)?.charId ?? slot.charId
    : slot.charId;

export default function FamilyPlannerView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const affinity = calculateFamilyAffinity(state.family, state.veterans);
  const warnings = familyValidation(state.family, state.veterans);
  const pairs = bestSavedParentPairs(state);
  const target = cardById.get(state.family.targetCardId);
  const parents = [state.family.slots.parent1, state.family.slots.parent2]
    .map((slot) => state.veterans.find((veteran) => veteran.id === slot.veteranId))
    .filter((veteran): veteran is Veteran => Boolean(veteran));
  const blueStars = parents.filter((veteran) => veteran.blueSpark.type === state.family.targetBlue).reduce((sum, veteran) => sum + veteran.blueSpark.stars, 0);
  const pinkStars = parents.filter((veteran) => veteran.pinkSpark.type === state.family.targetPink).reduce((sum, veteran) => sum + veteran.pinkSpark.stars, 0);
  const updateFamily = (patch: Partial<AppState["family"]>) => setState((current) => ({ ...current, family: { ...current.family, ...patch } }));
  const updateSlot = (key: FamilySlotKey, slot: PlannerSlot) => setState((current) => ({
    ...current,
    family: { ...current.family, slots: { ...current.family.slots, [key]: slot } },
  }));

  const parent1Char = slotCharacter(state.family.slots.parent1, state.veterans);
  const parent2Char = slotCharacter(state.family.slots.parent2, state.veterans);
  const parent1Affinity = pairAffinity(affinity.target, parent1Char);
  const parent2Affinity = pairAffinity(affinity.target, parent2Char);

  return <div className="view-stack family-workspace">
    <Panel className="family-toolbar">
      <SectionHeading
        eyebrow="Lineage workspace"
        title="Build the family around the target"
        description="Select the target, inheritance goals, and all six family members from one screen."
        action={<Badge tone={affinity.total >= 151 ? "mint" : affinity.total >= 51 ? "gold" : "coral"}>{affinity.symbol} {affinity.total} affinity</Badge>}
      />
      <div className="form-grid form-grid-3 family-goal-controls">
        <Field label="Target trainee"><select value={state.family.targetCardId} onChange={(event) => updateFamily({ targetCardId: Number(event.target.value) })}>{cards.map((card) => <option key={card.cardId} value={card.cardId}>{cardLabel(card)}</option>)}</select></Field>
        <Field label="Blue spark goal"><select value={state.family.targetBlue} onChange={(event) => updateFamily({ targetBlue: event.target.value as StatName })}>{STAT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
        <Field label="Pink spark goal"><select value={state.family.targetPink} onChange={(event) => updateFamily({ targetPink: event.target.value as AptitudeName })}>{APTITUDE_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
      </div>
    </Panel>

    <div className="family-board-v2">
      <Panel className="lineage-board-v2">
        <div className="lineage-board-title">
          <div><GitBranch size={16} /><strong>Seven-character family</strong></div>
          <span>Saved veterans include race and lineage bonuses; identities calculate fixed compatibility only.</span>
        </div>

        <div className="lineage-tree-v2">
          <div className="target-node-v2">
            <CharacterMark charId={target?.charId ?? 0} cardId={target?.cardId} size="large" />
            <div><small>Target trainee</small><strong>{target?.name ?? "Unselected"}</strong><span>{target?.outfit ?? "Choose a target"}</span></div>
            <div className="target-goals-v2"><Badge tone="blue">{state.family.targetBlue}</Badge><Badge>{state.family.targetPink}</Badge></div>
          </div>

          <div className="tree-branches-v2">
            <section className="tree-branch-v2 branch-one">
              <div className="branch-heading-v2"><span>Parent branch 1</span><Badge tone={parent1Affinity >= 26 ? "mint" : "neutral"}>{parent1Affinity} with target</Badge></div>
              <LineageSelect label="Parent 1" slot={state.family.slots.parent1} veterans={state.veterans} onChange={(slot) => updateSlot("parent1", slot)} />
              <div className="grandparent-row-v2">
                <LineageSelect label="Grandparent 1A" slot={state.family.slots.grandparent1A} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent1A", slot)} />
                <LineageSelect label="Grandparent 1B" slot={state.family.slots.grandparent1B} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent1B", slot)} />
              </div>
            </section>

            <section className="tree-branch-v2 branch-two">
              <div className="branch-heading-v2"><span>Parent branch 2</span><Badge tone={parent2Affinity >= 26 ? "mint" : "neutral"}>{parent2Affinity} with target</Badge></div>
              <LineageSelect label="Parent 2" slot={state.family.slots.parent2} veterans={state.veterans} onChange={(slot) => updateSlot("parent2", slot)} />
              <div className="grandparent-row-v2">
                <LineageSelect label="Grandparent 2A" slot={state.family.slots.grandparent2A} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent2A", slot)} />
                <LineageSelect label="Grandparent 2B" slot={state.family.slots.grandparent2B} veterans={state.veterans} onChange={(slot) => updateSlot("grandparent2B", slot)} />
              </div>
            </section>
          </div>
        </div>

        {warnings.length ? <div className="notice-list family-validation-v2">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="success-note family-validation-v2"><Check size={14} /> Family structure is valid.</div>}
      </Panel>

      <aside className="family-rail-v2">
        <Panel className="affinity-card-v2">
          <SectionHeading title="Affinity result" />
          <AffinityMeter score={affinity.total} symbol={affinity.symbol} tier={affinity.tier} />
          <div className="affinity-summary-v2">
            <div><span>Base compatibility</span><strong>{affinity.base}</strong></div>
            <div><span>Shared graded races</span><strong>+{affinity.sharedRaceBonus}</strong></div>
            <div><span>Shared crowns</span><strong>+{affinity.sharedCrownBonus}</strong></div>
          </div>
          <details className="breakdown-details-v2">
            <summary>Show calculation details</summary>
            <div className="result-table">{affinity.breakdown.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          </details>
        </Panel>

        <Panel className="quick-pairs-v2">
          <SectionHeading title="Best saved pairs" description="Apply a pair without rebuilding the branches manually." />
          <div className="pair-list">{pairs.length ? pairs.slice(0, 4).map((pair) => <div className="pair-row pair-row-v2" key={`${pair.first.id}-${pair.second.id}`}>
            <div className="pair-identities"><CharacterMark charId={pair.first.charId} cardId={pair.first.cardId} size="small" /><span>{pair.first.nickname || characterName(pair.first.charId)}</span><span>+</span><CharacterMark charId={pair.second.charId} cardId={pair.second.cardId} size="small" /><span>{pair.second.nickname || characterName(pair.second.charId)}</span></div>
            <Badge tone={pair.completeLineage ? "mint" : "neutral"}>{pair.score}</Badge>
            <Button variant="secondary" onClick={() => setState((current) => ({ ...current, family: familyFromParents(current.family.targetCardId, pair.first, pair.second, current.family.targetBlue, current.family.targetPink, current.veterans) }))}>Use</Button>
          </div>) : <p className="empty-state">Save at least two different veterans to rank parent pairs.</p>}</div>
        </Panel>
      </aside>
    </div>

    <Panel className="inheritance-strip-v2">
      <SectionHeading eyebrow="Inheritance reference" title="What the selected direct parents contribute" description="These are planning estimates; the final spark roll remains random." action={<Sparkles size={17} />} />
      <div className="compact-stat-grid">
        <div><small>Matching blue stars</small><strong>{blueStars}★</strong><span>Up to +{blueStartingBonus(Math.min(3, blueStars))} starting {state.family.targetBlue.toLowerCase()}</span></div>
        <div><small>Matching pink stars</small><strong>{pinkStars}★</strong><span>Up to {startingAptitudeRanks(pinkStars)} starting aptitude increases</span></div>
        <div><small>Best 3★ blue chance</small><strong>{parents.length ? Math.max(...parents.map((veteran) => blueThreeStarChance(veteran.finalStats[STAT_NAMES.indexOf(state.family.targetBlue)]))) : 0}%</strong><span>Based on the highest recorded target stat</span></div>
      </div>
    </Panel>
  </div>;
}
