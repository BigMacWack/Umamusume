"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { DATA_SNAPSHOT } from "../../data/uma-data";
import { CROWN_SETS } from "../../lib/affinity";
import { cards, characters } from "../../lib/data";
import { APTITUDE_NAMES, STAT_NAMES, type AppState } from "../../lib/types";
import { CharacterMark, Panel, SectionHeading, type StateSetter } from "./shared";

function AptitudeCell({ label, rank }: { label: string; rank: string }) {
  const tone = rank === "A" || rank === "S" ? "apt-good" : rank === "B" || rank === "C" ? "apt-mid" : "apt-low";
  return <span className={`aptitude-cell ${tone}`} title={label}><small>{label.slice(0, 3)}</small><strong>{rank}</strong></span>;
}

export function RosterView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const filtered = cards.filter((card) => `${card.name} ${card.outfit} ${card.release}`.toLowerCase().includes(query.toLowerCase()) && (!ownedOnly || state.ownedCardIds.includes(card.cardId)));
  const toggleOwned = (cardId: number) => setState((current) => ({ ...current, ownedCardIds: current.ownedCardIds.includes(cardId) ? current.ownedCardIds.filter((id) => id !== cardId) : [...current.ownedCardIds, cardId] }));
  return <div className="view-stack">
    <Panel><SectionHeading title="Trainee database" description={`${cards.length} Global trainee cards across ${characters.length} identities · snapshot ${DATA_SNAPSHOT}`} /><div className="filter-row"><label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trainee or outfit" /></label><label className="inline-check"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} /> Owned only</label></div></Panel>
    <div className="roster-grid">{filtered.map((card) => { const owned = state.ownedCardIds.includes(card.cardId); return <Panel className="roster-card" key={card.cardId}>
      <div className="roster-header"><CharacterMark charId={card.charId} cardId={card.cardId} size="large" /><div><h3>{card.name}</h3><p>{card.outfit}</p><span>{card.rarity}★ · {card.release}</span></div><button type="button" className={`owned-toggle ${owned ? "owned" : ""}`} onClick={() => toggleOwned(card.cardId)}>{owned ? "Owned" : "Not owned"}</button></div>
      <div className="growth-row">{STAT_NAMES.map((stat, index) => <span key={stat}><small>{stat.slice(0, 3)}</small><strong>{card.growth[index] ? `+${card.growth[index]}%` : "—"}</strong></span>)}</div>
      <div className="aptitude-grid">{APTITUDE_NAMES.map((name, index) => <AptitudeCell key={name} label={name} rank={card.aptitudes[index]} />)}</div>
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
