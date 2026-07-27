"use client";

import { Check, Sparkles, X } from "lucide-react";
import { CROWN_SETS } from "../../lib/affinity";
import { calendarLabel, cardsByCharacter, characters, raceById, type GradedRace } from "../../lib/data";
import { racePlanWarnings, suggestedG1Route } from "../../lib/recommendations";
import type { AppState } from "../../lib/types";
import { Button, CharacterMark, Field, Panel, RaceSelector, SectionHeading, type StateSetter } from "./shared";

export default function RacePlannerView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const selected = state.racePlan.raceIds.map((id) => raceById.get(id)).filter((race): race is GradedRace => Boolean(race)).sort((a, b) => a.year - b.year || a.month - b.month || a.half - b.half || a.name.localeCompare(b.name));
  const warnings = racePlanWarnings(state.racePlan.raceIds, state.racePlan.traineeCharId);
  const card = cardsByCharacter.get(state.racePlan.traineeCharId)?.[0];
  const names = new Set(selected.map((race) => race.name));
  const update = (patch: Partial<AppState["racePlan"]>) => setState((current) => ({ ...current, racePlan: { ...current.racePlan, ...patch } }));
  const toggle = (race: GradedRace) => update({ raceIds: state.racePlan.raceIds.includes(race.id) ? state.racePlan.raceIds.filter((id) => id !== race.id) : [...state.racePlan.raceIds, race.id] });
  return <div className="view-stack">
    <Panel>
      <SectionHeading title="Race plan" description="Build a reusable graded-race route and check aptitude or scheduling problems." action={<Button icon={Sparkles} onClick={() => update({ raceIds: suggestedG1Route(state.racePlan.traineeCharId, state.veterans).map((race) => race.id) })}>Suggest G1 route</Button>} />
      <div className="form-grid form-grid-2"><Field label="Plan name"><input value={state.racePlan.name} onChange={(event) => update({ name: event.target.value })} /></Field><Field label="Trainee identity"><select value={state.racePlan.traineeCharId} onChange={(event) => update({ traineeCharId: Number(event.target.value), raceIds: [] })}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></Field></div>
    </Panel>
    <div className="race-layout">
      <Panel><SectionHeading title="Available graded races" /><RaceSelector selectedIds={state.racePlan.raceIds} onToggle={toggle} /></Panel>
      <div className="view-stack compact-stack">
        <Panel><SectionHeading title="Selected route" description={`${selected.length} races`} /><div className="selected-race-list">{selected.length ? selected.map((race) => <div key={race.id}><span><strong>{race.name}</strong><small>{calendarLabel(race)} · {race.grade} · {race.distance}m</small></span><button type="button" onClick={() => toggle(race)} aria-label={`Remove ${race.name}`}><X size={14} /></button></div>) : <p className="empty-state">No races selected.</p>}</div></Panel>
        <Panel><SectionHeading title="Route checks" /><div className="trainee-inline">{card ? <CharacterMark charId={card.charId} cardId={card.cardId} /> : null}<div><strong>{card?.name ?? "Trainee"}</strong><span>{card?.outfit}</span></div></div>{warnings.length ? <div className="notice-list">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="success-note"><Check size={14} /> No route warnings.</div>}</Panel>
        <Panel><SectionHeading title="Crown progress" /><div className="crown-list">{CROWN_SETS.map((crown) => { const count = crown.races.filter((race) => names.has(race)).length; return <div key={crown.name}><span>{crown.name}</span><strong>{count}/{crown.races.length}</strong></div>; })}</div></Panel>
      </div>
    </div>
  </div>;
}
