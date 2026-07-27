"use client";

import { Flag, Menu, X } from "lucide-react";
import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { DATA_SNAPSHOT } from "../data/uma-data";
import { importBackup, defaultState, loadState, saveState } from "../lib/storage";
import type { AppState, AppView } from "../lib/types";
import DashboardView from "./planner/DashboardView";
import FamilyPlannerView from "./planner/FamilyPlannerView";
import RacePlannerView from "./planner/RacePlannerView";
import { GuideView, RosterView } from "./planner/RosterGuideViews";
import VeteransView from "./planner/VeteransView";
import { HeaderActions, navItems } from "./planner/shared";

function Sidebar({ view, open, onSelect, onClose }:
  { view: AppView; open: boolean; onSelect: (view: AppView) => void; onClose: () => void }) {
  return <>
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Flag size={18} /></div><div><strong>Uma Planner</strong><span>Parent farming</span></div><button className="close-menu" type="button" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
      <nav>{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" className={view === item.id ? "active" : ""} onClick={() => { onSelect(item.id); onClose(); }}><Icon size={16} /><span>{item.label}</span></button>; })}</nav>
      <div className="sidebar-note"><span className="status-dot" /><div><strong>Global data</strong><span>{DATA_SNAPSHOT}</span></div></div>
    </aside>
    {open ? <button className="sidebar-scrim" type="button" onClick={onClose} aria-label="Close navigation" /> : null}
  </>;
}

export default function PlannerApp() {
  const [state, setState] = useState<AppState>(() => defaultState);
  const [view, setView] = useState<AppView>("planner");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setState(loadState()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveState(state); }, [loaded, state]);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { setState(await importBackup(file)); }
    catch (error) { alert(error instanceof Error ? error.message : "Could not import this backup."); }
    finally { event.target.value = ""; }
  };
  const reset = () => { if (confirm("Reset all saved planner data in this browser?")) setState(defaultState); };
  const useSuggestion = (charId: number, raceIds: string[]) => {
    setState((current) => ({ ...current, racePlan: { ...current.racePlan, traineeCharId: charId, raceIds } }));
    setView("races");
  };

  let content: ReactNode;
  switch (view) {
    case "planner": content = <FamilyPlannerView state={state} setState={setState} />; break;
    case "veterans": content = <VeteransView state={state} setState={setState} />; break;
    case "races": content = <RacePlannerView state={state} setState={setState} />; break;
    case "roster": content = <RosterView state={state} setState={setState} />; break;
    case "guide": content = <GuideView />; break;
    default: content = <DashboardView state={state} onNavigate={setView} onUseSuggestion={useSuggestion} />;
  }
  const title = navItems.find((item) => item.id === view)?.label ?? "Family planner";
  return <div className="app-shell">
    <Sidebar view={view} open={menuOpen} onSelect={setView} onClose={() => setMenuOpen(false)} />
    <main className="app-main">
      <header className="app-header"><button className="mobile-menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="header-title"><p>Umamusume parent farming</p><h1>{title}</h1></div><HeaderActions state={state} onImport={handleImport} onReset={reset} /></header>
      <div className="app-content">{content}</div>
      <footer><span>Umamusume Parent Planner</span><span>Independent fan-made tool · data snapshot {DATA_SNAPSHOT}</span></footer>
    </main>
  </div>;
}
