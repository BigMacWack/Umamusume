"use client";

import { Check, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { CROWN_SETS } from "../../lib/affinity";
import { calendarLabel, cardById, cardsByCharacter, gradedRaces, raceById, turnKey, type GradedRace } from "../../lib/data";
import { racePlanWarnings, suggestedG1Route } from "../../lib/recommendations";
import type { AppState } from "../../lib/types";
import { Badge, Button, CardPicker, CharacterMark, Field, Panel, RaceMark, SectionHeading, type StateSetter } from "./shared";

const yearNames = { 1: "Junior", 2: "Classic", 3: "Senior" } as const;
const halves = [{ month: 1, half: 1 }, { month: 1, half: 2 }, { month: 2, half: 1 }, { month: 2, half: 2 }, { month: 3, half: 1 }, { month: 3, half: 2 }, { month: 4, half: 1 }, { month: 4, half: 2 }, { month: 5, half: 1 }, { month: 5, half: 2 }, { month: 6, half: 1 }, { month: 6, half: 2 }, { month: 7, half: 1 }, { month: 7, half: 2 }, { month: 8, half: 1 }, { month: 8, half: 2 }, { month: 9, half: 1 }, { month: 9, half: 2 }, { month: 10, half: 1 }, { month: 10, half: 2 }, { month: 11, half: 1 }, { month: 11, half: 2 }, { month: 12, half: 1 }, { month: 12, half: 2 }] as const;

export default function RacePlannerView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const [activeYear, setActiveYear] = useState<1 | 2 | 3>(state.settings.defaultRaceYear);
  const [activeMonth, setActiveMonth] = useState(1);
  const [activeHalf, setActiveHalf] = useState<1 | 2>(1);
  const [gradeFilter, setGradeFilter] = useState<"All" | "G1" | "G2" | "G3">("All");
  const selected = state.racePlan.raceIds.map((id) => raceById.get(id)).filter((race): race is GradedRace => Boolean(race)).sort((a, b) => a.year - b.year || a.month - b.month || a.half - b.half || a.name.localeCompare(b.name));
  const warnings = racePlanWarnings(state.racePlan.raceIds, state.racePlan.traineeCharId);
  const card = cardsByCharacter.get(state.racePlan.traineeCharId)?.[0];
  const names = new Set(selected.map((race) => race.name));
  const update = (patch: Partial<AppState["racePlan"]>) => setState((current) => ({ ...current, racePlan: { ...current.racePlan, ...patch } }));
  const toggle = (race: GradedRace) => {
    const exists = state.racePlan.raceIds.includes(race.id);
    const withoutTurn = state.racePlan.raceIds.filter((id) => {
      const current = raceById.get(id);
      return current ? turnKey(current) !== turnKey(race) : true;
    });
    update({ raceIds: exists ? state.racePlan.raceIds.filter((id) => id !== race.id) : [...withoutTurn, race.id] });
  };
  const selectedByTurn = new Map(selected.map((race) => [turnKey(race), race]));
  const activeRaces = gradedRaces.filter((race) => race.year === activeYear && race.month === activeMonth && race.half === activeHalf && (gradeFilter === "All" || race.grade === gradeFilter));
  const selectedCardId = card?.cardId ?? cardsByCharacter.get(state.racePlan.traineeCharId)?.[0]?.cardId ?? 0;

  return <div className="view-stack race-planner-v2">
    <Panel className="race-plan-toolbar">
      <SectionHeading title="Race rotation" description="The calendar mirrors the in-game reservation screen: one race can be planned in each early/late month slot." action={<Button icon={Sparkles} onClick={() => update({ raceIds: suggestedG1Route(state.racePlan.traineeCharId, state.veterans, state.settings.suggestedRouteLength).map((race) => race.id) })}>Suggest {state.settings.suggestedRouteLength}-race G1 route</Button>} />
      <div className="form-grid form-grid-2"><Field label="Plan name"><input value={state.racePlan.name} onChange={(event) => update({ name: event.target.value })} /></Field><div className="field"><span>Trainee</span><CardPicker value={selectedCardId} onChange={(cardId) => { const next = cardById.get(cardId); if (next) update({ traineeCharId: next.charId, raceIds: [] }); }} ownedCardIds={state.ownedCardIds} ownedFirst={state.settings.ownedCardsFirst} label="Race trainee" /></div></div>
    </Panel>

    <div className="race-layout-v2">
      <Panel className="game-calendar-panel">
        <div className="calendar-tabs">{([1, 2, 3] as const).map((year) => <button key={year} type="button" className={activeYear === year ? "active" : ""} onClick={() => setActiveYear(year)}>{yearNames[year]}</button>)}</div>
        <div className="game-race-calendar">{halves.map(({ month, half }) => {
          const key = `${activeYear}-${month}-${half}`;
          const race = selectedByTurn.get(key);
          const active = activeMonth === month && activeHalf === half;
          return <button key={key} type="button" className={`calendar-slot ${active ? "active" : ""} ${race ? "reserved" : "empty"}`} onClick={() => { setActiveMonth(month); setActiveHalf(half); }}>
            <span className="slot-banner">{race ? <RaceMark race={race} size="wide" showImage={state.settings.showRaceIcons} /> : <Plus size={25} />}{race ? <em>Planned</em> : null}</span>
            <strong>{month} / {half === 1 ? "Early" : "Late"}</strong>
          </button>;
        })}</div>
        <div className="turn-race-picker">
          <div className="turn-picker-heading"><div><small>{yearNames[activeYear]}</small><h3>{activeMonth} / {activeHalf === 1 ? "Early" : "Late"}</h3></div><div className="grade-chips">{(["All", "G1", "G2", "G3"] as const).map((grade) => <button type="button" className={gradeFilter === grade ? "active" : ""} key={grade} onClick={() => setGradeFilter(grade)}>{grade}</button>)}</div></div>
          <div className="turn-race-options">{activeRaces.length ? activeRaces.map((race) => {
            const checked = state.racePlan.raceIds.includes(race.id);
            return <button key={race.id} type="button" className={checked ? "selected" : ""} onClick={() => toggle(race)}>{state.settings.showRaceIcons ? <RaceMark race={race} size="normal" /> : <Badge tone={race.grade === "G1" ? "gold" : "neutral"}>{race.grade}</Badge>}<span><strong>{race.name}</strong>{state.settings.showRaceDetails ? <small>{race.grade} · {race.surface} · {race.distance}m</small> : null}</span>{checked ? <Check size={16} /> : <Plus size={16} />}</button>;
          }) : <p className="empty-state">No graded races match this turn and grade filter.</p>}</div>
        </div>
      </Panel>

      <div className="view-stack compact-stack race-side-v2">
        <Panel><SectionHeading title="Selected route" description={`${selected.length} planned races`} /><div className="selected-race-list">{selected.length ? selected.map((race) => <div key={race.id}>{state.settings.showRaceIcons ? <RaceMark race={race} size="small" /> : null}<span><strong>{race.name}</strong><small>{calendarLabel(race)} · {race.grade} · {race.distance}m</small></span><button type="button" onClick={() => toggle(race)} aria-label={`Remove ${race.name}`}><X size={14} /></button></div>) : <p className="empty-state">No races selected.</p>}</div></Panel>
        <Panel><SectionHeading title="Route checks" /><div className="trainee-inline">{card ? <CharacterMark charId={card.charId} cardId={card.cardId} /> : null}<div><strong>{card?.name ?? "Trainee"}</strong><span>{card?.outfit}</span></div></div>{warnings.length ? <div className="notice-list">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="success-note"><Check size={14} /> No route warnings.</div>}</Panel>
        <Panel><SectionHeading title="Crown progress" /><div className="crown-list">{CROWN_SETS.map((crown) => { const count = crown.races.filter((race) => names.has(race)).length; return <div key={crown.name}><span>{crown.name}</span><strong>{count}/{crown.races.length}</strong></div>; })}</div></Panel>
      </div>
    </div>
  </div>;
}
