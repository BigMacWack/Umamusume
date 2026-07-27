"use client";

import { Archive, ArrowRight, Check, GitBranch, Plus, Sparkles, Target, Trophy } from "lucide-react";
import { DATA_SNAPSHOT } from "../../data/uma-data";
import { calculateFamilyAffinity } from "../../lib/affinity";
import { cardById, raceById } from "../../lib/data";
import { nextRunSuggestions } from "../../lib/recommendations";
import type { AppState, AppView } from "../../lib/types";
import { AffinityMeter, Badge, Button, CharacterMark, Panel, SectionHeading } from "./shared";

function TargetSummary({ state }: { state: AppState }) {
  const target = cardById.get(state.family.targetCardId);
  if (!target) return null;
  return <div className="target-summary">
    <CharacterMark charId={target.charId} cardId={target.cardId} size="large" />
    <div><p className="eyebrow">Current target</p><h3>{target.name}</h3><p>{target.outfit}</p></div>
    <div className="mini-stats">{["Spe", "Sta", "Pow", "Gut", "Wit"].map((stat, index) => <span key={stat}><small>{stat}</small><strong>{target.fiveStar[index]}</strong></span>)}</div>
  </div>;
}

export default function DashboardView({ state, onNavigate, onUseSuggestion }:
  { state: AppState; onNavigate: (view: AppView) => void; onUseSuggestion: (charId: number, raceIds: string[]) => void }) {
  const affinity = calculateFamilyAffinity(state.family, state.veterans);
  const suggestions = nextRunSuggestions(state).slice(0, 3);
  const wins = new Set(state.veterans.flatMap((veteran) => veteran.raceIds.map((id) => raceById.get(id)?.name).filter(Boolean))).size;
  return <div className="view-stack">
    <Panel className="hero-panel">
      <div className="hero-copy"><div className="hero-kicker">Global data · {DATA_SNAPSHOT}</div><h2>Current farming overview</h2><p>Review your family, saved veterans, race coverage, and next recommended trainee.</p><div className="hero-actions"><Button icon={GitBranch} onClick={() => onNavigate("planner")}>Open planner</Button><Button icon={Plus} variant="secondary" onClick={() => onNavigate("veterans")}>Add veteran</Button></div></div>
      <div className="hero-score"><span>Family affinity</span><AffinityMeter score={affinity.total} symbol={affinity.symbol} tier={affinity.tier} compact /></div>
    </Panel>
    <div className="metric-grid">
      <Panel className="metric-card"><Archive size={17} /><div><small>Veterans</small><strong>{state.veterans.length}</strong><span>saved locally</span></div></Panel>
      <Panel className="metric-card"><Trophy size={17} /><div><small>Graded wins</small><strong>{wins}</strong><span>unique races</span></div></Panel>
      <Panel className="metric-card"><Sparkles size={17} /><div><small>Race bonus</small><strong>+{affinity.sharedRaceBonus + affinity.sharedCrownBonus}</strong><span>current family</span></div></Panel>
      <Panel className="metric-card"><Target size={17} /><div><small>Farm goal</small><strong className="metric-text">{state.family.targetBlue}</strong><span>{state.family.targetPink} pink</span></div></Panel>
    </div>
    <div className="dashboard-grid">
      <Panel>
        <SectionHeading title="Recommended next trainees" description="Ranked from target affinity, saved links, growth bonuses, aptitude, and roster coverage." action={<Button variant="ghost" onClick={() => onNavigate("planner")}>Edit goals <ArrowRight size={14} /></Button>} />
        <div className="suggestion-list">{suggestions.map((suggestion, index) => <article className="suggestion-card" key={suggestion.charId}>
          <span className="rank-number">{index + 1}</span><CharacterMark charId={suggestion.charId} cardId={suggestion.cardId} />
          <div className="suggestion-copy"><div><h3>{suggestion.name}</h3><Badge tone={index === 0 ? "mint" : "neutral"}>Fit {suggestion.score}</Badge></div><p>{suggestion.outfit}</p><ul>{suggestion.reasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          <Button variant="secondary" onClick={() => onUseSuggestion(suggestion.charId, suggestion.suggestedRaceIds)}>Plan run</Button>
        </article>)}</div>
      </Panel>
      <div className="dashboard-side">
        <Panel><SectionHeading title="Current target" /><TargetSummary state={state} /><div className="goal-pills"><span>{state.family.targetBlue} blue</span><span>{state.family.targetPink} pink</span></div></Panel>
        <Panel><SectionHeading title="Readiness" />{[
          { done: state.veterans.length >= 2, text: "At least two saved veterans" },
          { done: affinity.total >= 151, text: "Current family reaches ◎" },
          { done: affinity.sharedRaceBonus >= 3, text: "Three or more shared graded wins" },
          { done: state.racePlan.raceIds.length >= 6, text: "Next race route is planned" },
        ].map((item) => <div className="check-row" key={item.text}><span className={item.done ? "done" : ""}>{item.done ? <Check size={12} /> : null}</span><p>{item.text}</p></div>)}</Panel>
      </div>
    </div>
  </div>;
}
