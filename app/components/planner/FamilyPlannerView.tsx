"use client";

import { Check } from "lucide-react";
import {
  blueStartingBonus,
  blueThreeStarChance,
  calculateFamilyAffinity,
  familyValidation,
  startingAptitudeRanks,
} from "../../lib/affinity";
import { cardLabel, cards, characterName } from "../../lib/data";
import { bestSavedParentPairs, familyFromParents } from "../../lib/recommendations";
import { APTITUDE_NAMES, STAT_NAMES, type AppState, type AptitudeName, type StatName, type Veteran } from "../../lib/types";
import {
  AffinityMeter,
  Badge,
  Button,
  CharacterMark,
  Field,
  LineageSelect,
  Panel,
  SectionHeading,
  slotKeys,
  slotLabels,
  type StateSetter,
} from "./shared";

export default function FamilyPlannerView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const affinity = calculateFamilyAffinity(state.family, state.veterans);
  const warnings = familyValidation(state.family, state.veterans);
  const pairs = bestSavedParentPairs(state);
  const parents = [state.family.slots.parent1, state.family.slots.parent2]
    .map((slot) => state.veterans.find((veteran) => veteran.id === slot.veteranId))
    .filter((veteran): veteran is Veteran => Boolean(veteran));
  const blueStars = parents.filter((veteran) => veteran.blueSpark.type === state.family.targetBlue).reduce((sum, veteran) => sum + veteran.blueSpark.stars, 0);
  const pinkStars = parents.filter((veteran) => veteran.pinkSpark.type === state.family.targetPink).reduce((sum, veteran) => sum + veteran.pinkSpark.stars, 0);
  const updateFamily = (patch: Partial<AppState["family"]>) => setState((current) => ({ ...current, family: { ...current.family, ...patch } }));

  return <div className="view-stack">
    <Panel>
      <SectionHeading title="Target and inheritance goals" description="Choose the trainee being raised and the blue/pink sparks you are farming." />
      <div className="form-grid form-grid-3">
        <Field label="Target trainee"><select value={state.family.targetCardId} onChange={(event) => updateFamily({ targetCardId: Number(event.target.value) })}>{cards.map((card) => <option key={card.cardId} value={card.cardId}>{cardLabel(card)}</option>)}</select></Field>
        <Field label="Blue spark"><select value={state.family.targetBlue} onChange={(event) => updateFamily({ targetBlue: event.target.value as StatName })}>{STAT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
        <Field label="Pink spark"><select value={state.family.targetPink} onChange={(event) => updateFamily({ targetPink: event.target.value as AptitudeName })}>{APTITUDE_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
      </div>
    </Panel>
    <div className="planner-layout">
      <Panel>
        <SectionHeading title="Seven-character family" description="Saved veterans include their races and recorded parents; identities calculate fixed affinity only." />
        <div className="lineage-grid">{slotKeys.map((key) => <LineageSelect key={key} label={slotLabels[key]} slot={state.family.slots[key]} veterans={state.veterans} onChange={(slot) => setState((current) => ({ ...current, family: { ...current.family, slots: { ...current.family.slots, [key]: slot } } }))} />)}</div>
        {warnings.length ? <div className="notice-list">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="success-note"><Check size={14} /> Family structure is valid.</div>}
      </Panel>
      <Panel className="affinity-panel">
        <SectionHeading title="Affinity result" />
        <AffinityMeter score={affinity.total} symbol={affinity.symbol} tier={affinity.tier} />
        <div className="result-table">{affinity.breakdown.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}<div><span>Shared graded races</span><strong>+{affinity.sharedRaceBonus}</strong></div><div><span>Shared crowns</span><strong>+{affinity.sharedCrownBonus}</strong></div><div className="result-total"><span>Total</span><strong>{affinity.total}</strong></div></div>
      </Panel>
    </div>
    <div className="two-column-grid">
      <Panel>
        <SectionHeading title="Inheritance estimate" description="Reference values only; spark appearance remains random." />
        <div className="compact-stat-grid">
          <div><small>Matching blue stars</small><strong>{blueStars}★</strong><span>Up to +{blueStartingBonus(Math.min(3, blueStars))} starting stat</span></div>
          <div><small>Matching pink stars</small><strong>{pinkStars}★</strong><span>Up to {startingAptitudeRanks(pinkStars)} starting aptitude increases</span></div>
          <div><small>3★ blue chance</small><strong>{parents.length ? Math.max(...parents.map((veteran) => blueThreeStarChance(veteran.finalStats[STAT_NAMES.indexOf(state.family.targetBlue)]))) : 0}%</strong><span>Highest recorded target stat</span></div>
        </div>
      </Panel>
      <Panel>
        <SectionHeading title="Best saved parent pairs" description="Uses complete recorded lineage when available." />
        <div className="pair-list">{pairs.length ? pairs.slice(0, 5).map((pair) => <div className="pair-row" key={`${pair.first.id}-${pair.second.id}`}>
          <div className="pair-identities"><CharacterMark charId={pair.first.charId} size="small" /><span>{pair.first.nickname || characterName(pair.first.charId)}</span><span>+</span><CharacterMark charId={pair.second.charId} size="small" /><span>{pair.second.nickname || characterName(pair.second.charId)}</span></div>
          <Badge tone={pair.completeLineage ? "mint" : "neutral"}>{pair.score}</Badge>
          <Button variant="secondary" onClick={() => setState((current) => ({ ...current, family: familyFromParents(current.family.targetCardId, pair.first, pair.second, current.family.targetBlue, current.family.targetPink, current.veterans) }))}>Use pair</Button>
        </div>) : <p className="empty-state">Save at least two different veterans to rank parent pairs.</p>}</div>
      </Panel>
    </div>
  </div>;
}
