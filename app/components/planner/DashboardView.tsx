"use client";

import { Archive, ArrowRight, Check, GitBranch, Plus, Target, Users } from "lucide-react";
import { DATA_SNAPSHOT } from "../../data/uma-data";
import { calculateFamilyAffinity } from "../../lib/affinity";
import { cardById } from "../../lib/data";
import { bestSavedParentPairs, nextRunSuggestions } from "../../lib/recommendations";
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
  const savedPairs = bestSavedParentPairs(state).length;
  return <div className="view-stack">
    <Panel className="hero-panel">
      <div className="hero-copy"><div className="hero-kicker">Global data · {DATA_SNAPSHOT}</div><h2>Current farming overview</h2><p>Review the target family, saved veteran options, and the next trainee worth training.</p><div className="hero-actions"><Button icon={GitBranch} onClick={() => onNavigate("planner")}>Open planner</Button><Button icon={Plus} variant="secondary" onClick={() => onNavigate("veterans")}>Add veteran</Button></div></div>
      <div className="hero-score"><span>Family compatibility</span><AffinityMeter score={affinity.total} symbol={affinity.symbol} tier={affinity.tier} compact /></div>
    </Panel>
    <div className="metric-grid">
      <Panel className="metric-card"><Archive size={17} /><div><small>Veterans</small><strong>{state.veterans.length}</strong><span>saved locally</span></div></Panel>
      <Panel className="metric-card"><Users size={17} /><div><small>Usable saved pairs</small><strong>{savedPairs}</strong><span>ranked for the target</span></div></Panel>
      <Panel className="metric-card"><Target size={17} /><div><small>Blue goal</small><strong className="metric-text">{state.family.targetBlue} {state.family.targetBlueStars}★</strong><span>desired factor</span></div></Panel>
      <Panel className="metric-card"><Target size={17} /><div><small>Pink goal</small><strong className="metric-text">{state.family.targetPink} {state.family.targetPinkStars}★</strong><span>desired aptitude</span></div></Panel>
    </div>
    <div className="dashboard-grid">
      <Panel>
        <SectionHeading title="Recommended next trainees" description="Ranked from target compatibility, saved links, growth bonuses, aptitude, and roster coverage." action={<Button variant="ghost" onClick={() => onNavigate("planner")}>Edit goals <ArrowRight size={14} /></Button>} />
        <div className="suggestion-list">{suggestions.map((suggestion, index) => <article className="suggestion-card" key={suggestion.charId}>
          <span className="rank-number">{index + 1}</span><CharacterMark charId={suggestion.charId} cardId={suggestion.cardId} />
          <div className="suggestion-copy"><div><h3>{suggestion.name}</h3><Badge tone={index === 0 ? "mint" : "neutral"}>Fit {suggestion.score}</Badge></div><p>{suggestion.outfit}</p><ul>{suggestion.reasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          <Button variant="secondary" onClick={() => onUseSuggestion(suggestion.charId, suggestion.suggestedRaceIds)}>Plan run</Button>
        </article>)}</div>
      </Panel>
      <div className="dashboard-side">
        <Panel><SectionHeading title="Current target" /><TargetSummary state={state} /><div className="goal-pills"><span>{state.family.targetBlue} {state.family.targetBlueStars}★ blue</span><span>{state.family.targetPink} {state.family.targetPinkStars}★ pink</span></div></Panel>
        <Panel><SectionHeading title="Readiness" />{[
          { done: state.veterans.length >= 2, text: "At least two saved veterans" },
          { done: affinity.total >= 151, text: "Current family reaches ◎" },
          { done: savedPairs > 0, text: "A saved parent pair can be recommended" },
          { done: state.racePlan.raceIds.length >= 6, text: "Next race route is planned" },
        ].map((item) => <div className="check-row" key={item.text}><span className={item.done ? "done" : ""}>{item.done ? <Check size={12} /> : null}</span><p>{item.text}</p></div>)}</Panel>
      </div>
    </div>
  </div>;
}
