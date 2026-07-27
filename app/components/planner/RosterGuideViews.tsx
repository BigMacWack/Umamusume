"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { DATA_SNAPSHOT } from "../../data/uma-data";
import { CROWN_SETS } from "../../lib/affinity";
import { cards, characters } from "../../lib/data";
import { APTITUDE_NAMES, STAT_NAMES, type AppState } from "../../lib/types";
import { CharacterMark, Panel, SectionHeading, type StateSetter } from "./shared";

function AptitudeCell({ label, rank }: { label: string; rank: string }) {
  return <span className={`aptitude-cell apt-rank-${rank.toLowerCase()}`} title={`${label}: ${rank}`}><small>{label.slice(0, 3)}</small><strong>{rank}</strong></span>;
}

export function RosterView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const filtered = cards.filter((trainee) => `${trainee.name} ${trainee.outfit} ${trainee.release}`.toLowerCase().includes(query.toLowerCase()) && (!ownedOnly || state.ownedCardIds.includes(trainee.cardId)));
  const toggleOwned = (traineeId: number) => setState((current) => ({ ...current, ownedCardIds: current.ownedCardIds.includes(traineeId) ? current.ownedCardIds.filter((id) => id !== traineeId) : [...current.ownedCardIds, traineeId] }));
  return <div className="view-stack">
    <Panel><SectionHeading title="Trainee database" description={`${cards.length} Global trainee versions across ${characters.length} identities · snapshot ${DATA_SNAPSHOT}`} /><div className="filter-row"><label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trainee or outfit" /></label><label className="inline-check"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} /> Owned only</label></div></Panel>
    <div className="roster-grid">{filtered.map((trainee) => { const owned = state.ownedCardIds.includes(trainee.cardId); return <Panel className="roster-card" key={trainee.cardId}>
      <div className="roster-header"><CharacterMark charId={trainee.charId} cardId={trainee.cardId} size="large" /><div><h3>{trainee.name}</h3><p>{trainee.outfit}</p><span>{trainee.rarity}★ · {trainee.release}</span></div><button type="button" className={`owned-toggle ${owned ? "owned" : ""}`} onClick={() => toggleOwned(trainee.cardId)}>{owned ? "Owned" : "Not owned"}</button></div>
      <div className="growth-row">{STAT_NAMES.map((stat, index) => <span key={stat}><small>{stat.slice(0, 3)}</small><strong>{trainee.growth[index] ? `+${trainee.growth[index]}%` : "—"}</strong></span>)}</div>
      <div className="aptitude-grid">{APTITUDE_NAMES.map((name, index) => <AptitudeCell key={name} label={name} rank={trainee.aptitudes[index]} />)}</div>
    </Panel>; })}</div>
  </div>;
}

export function GuideView() {
  return <div className="guide-grid">
    <Panel><SectionHeading title="Affinity tiers" /><div className="guide-table"><div><strong>△ Poor</strong><span>0–50</span></div><div><strong>○ Good</strong><span>51–150</span></div><div><strong>◎ Great</strong><span>151+</span></div></div><p className="guide-copy">The result combines target-parent pairs, target-parent-grandparent trios, the direct-parent pair, and saved race/title bonuses.</p></Panel>
    <Panel><SectionHeading title="Blue spark reference" /><div className="guide-table"><div><strong>Final stat below 600</strong><span>0% 3★</span></div><div><strong>600–1100</strong><span>5% 3★</span></div><div><strong>Above 1100</strong><span>10% 3★</span></div></div><p className="guide-copy">Starting stat bonuses are +5, +12, and +21 for 1★, 2★, and 3★ blue sparks.</p></Panel>
    <Panel><SectionHeading title="How to use the planner" /><ol className="guide-steps"><li>Save veterans with sparks, wins, and parents.</li><li>Choose the target and inheritance goals.</li><li>Fill all six family slots or apply a ranked pair.</li><li>Plan overlapping graded wins and crown sets.</li><li>Export a backup before clearing browser data.</li></ol></Panel>
    <Panel><SectionHeading title="Crown sets tracked" /><div className="crown-guide">{CROWN_SETS.map((crown) => <div key={crown.name}><strong>{crown.name}</strong><span>{crown.races.join(" · ")}</span></div>)}</div></Panel>
    <Panel className="guide-wide"><SectionHeading title="Limitations" /><p className="guide-copy">Recommendations are planning heuristics. They do not guarantee spark rarity, inheritance activation, training results, or race wins. Data reflects the Global snapshot shown in the app.</p></Panel>
  </div>;
}
