"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { DATA_SNAPSHOT } from "../../data/uma-data";
import { CROWN_SETS } from "../../lib/affinity";
import { cards, characters } from "../../lib/data";
import { APTITUDE_NAMES, STAT_NAMES, type AppState } from "../../lib/types";
import { CharacterMark, Panel, SectionHeading, type StateSetter } from "./shared";

const APTITUDE_GROUPS = [
  { label: "Surface aptitude", indices: [0, 1] },
  { label: "Distance aptitude", indices: [2, 3, 4, 5] },
  { label: "Running-style aptitude", indices: [6, 7, 8, 9] },
] as const;

function AptitudeCell({ label, rank }: { label: string; rank: string }) {
  return <span className={`aptitude-cell apt-rank-${rank.toLowerCase()}`} title={`${label} aptitude: ${rank} rank`} aria-label={`${label} aptitude, rank ${rank}`}>
    <span className="aptitude-name">{label}</span>
    <strong>{rank}</strong>
  </span>;
}

export function RosterView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const filtered = cards.filter((trainee) => `${trainee.name} ${trainee.outfit} ${trainee.release}`.toLowerCase().includes(query.toLowerCase()) && (!ownedOnly || state.ownedCardIds.includes(trainee.cardId)));
  const toggleOwned = (traineeId: number) => setState((current) => ({ ...current, ownedCardIds: current.ownedCardIds.includes(traineeId) ? current.ownedCardIds.filter((id) => id !== traineeId) : [...current.ownedCardIds, traineeId] }));
  return <div className="view-stack">
    <Panel><SectionHeading title="Trainee database" description={`${cards.length} Global trainee versions across ${characters.length} trainees · data snapshot ${DATA_SNAPSHOT}`} /><div className="filter-row"><label className="search-box"><Search size={14} /><input aria-label="Search trainees" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trainee name or outfit" /></label><label className="inline-check"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} /> Show owned trainees only</label></div></Panel>
    <div className="roster-grid">{filtered.map((trainee) => { const owned = state.ownedCardIds.includes(trainee.cardId); return <Panel className="roster-card" key={trainee.cardId}>
      <div className="roster-header"><CharacterMark charId={trainee.charId} cardId={trainee.cardId} size="large" /><div><h3>{trainee.name}</h3><p>{trainee.outfit}</p><span>{trainee.rarity}★ rarity · Released {trainee.release}</span></div><button type="button" aria-pressed={owned} aria-label={`${owned ? "Remove" : "Add"} ${trainee.name} ${trainee.outfit} ${owned ? "from" : "to"} owned trainees`} className={`owned-toggle ${owned ? "owned" : ""}`} onClick={() => toggleOwned(trainee.cardId)}>{owned ? "Owned" : "Not owned"}</button></div>
      <section className="trainee-data-section" aria-label="Stat growth bonuses">
        <h4 className="trainee-section-label">Stat growth bonuses</h4>
        <div className="growth-row">{STAT_NAMES.map((stat, index) => { const growth = trainee.growth[index]; return <span key={stat} title={`${stat} growth bonus: ${growth ? `plus ${growth} percent` : "none"}`}><small>{stat}</small><strong>{growth ? `+${growth}%` : "None"}</strong></span>; })}</div>
      </section>
      <section className="trainee-data-section" aria-label="Aptitude ranks">
        <h4 className="trainee-section-label">Aptitude ranks</h4>
        <div className="aptitude-groups">{APTITUDE_GROUPS.map((group) => <div className="aptitude-group" key={group.label}><h5>{group.label}</h5><div className="aptitude-group-grid">{group.indices.map((index) => <AptitudeCell key={APTITUDE_NAMES[index]} label={APTITUDE_NAMES[index]} rank={trainee.aptitudes[index]} />)}</div></div>)}</div>
      </section>
    </Panel>; })}</div>
  </div>;
}

export function GuideView() {
  return <div className="guide-grid">
    <Panel><SectionHeading title="Compatibility tiers" /><div className="guide-table"><div><strong>△ Poor compatibility</strong><span>0–50</span></div><div><strong>○ Good compatibility</strong><span>51–150</span></div><div><strong>◎ Great compatibility</strong><span>151+</span></div></div><p className="guide-copy">The result combines target-parent pairs, target-parent-grandparent trios, the direct-parent pair, and bonuses from shared graded races and completed crown sets.</p></Panel>
    <Panel><SectionHeading title="Blue factor reference" /><div className="guide-table"><div><strong>Final stat below 600</strong><span>0% chance of 3★</span></div><div><strong>Final stat from 600–1100</strong><span>5% chance of 3★</span></div><div><strong>Final stat above 1100</strong><span>10% chance of 3★</span></div></div><p className="guide-copy">Starting stat bonuses are +5, +12, and +21 for 1★, 2★, and 3★ blue factors.</p></Panel>
    <Panel><SectionHeading title="How to use the planner" /><ol className="guide-steps"><li>Save veterans with factors, race wins, and recorded parents.</li><li>Choose a target trainee and inheritance goals.</li><li>Fill all six family slots or apply a recommended saved-parent pair.</li><li>Plan shared graded wins and crown sets.</li><li>Export a backup before clearing browser data.</li></ol></Panel>
    <Panel><SectionHeading title="Tracked crown sets" /><div className="crown-guide">{CROWN_SETS.map((crown) => <div key={crown.name}><strong>{crown.name}</strong><span>{crown.races.join(" · ")}</span></div>)}</div></Panel>
    <Panel className="guide-wide"><SectionHeading title="Planner limitations" /><p className="guide-copy">Recommendations are planning heuristics. They do not guarantee factor rarity, inheritance activation, training results, or race wins. Data reflects the Global snapshot shown in the app.</p></Panel>
  </div>;
}
