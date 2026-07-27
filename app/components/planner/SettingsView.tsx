"use client";

import { CalendarDays, Database, Eye, RotateCcw, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { cards, characters, gradedRaces } from "../../lib/data";
import { defaultSettings } from "../../lib/storage";
import type { AppSettings, AppState } from "../../lib/types";
import { Button, Field, Panel, SectionHeading, type StateSetter } from "./shared";

export default function SettingsView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setState((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  const resetSettings = () => setState((current) => ({ ...current, settings: { ...defaultSettings } }));
  return <div className="view-stack settings-view">
    <Panel className="settings-intro"><SectionHeading eyebrow="Planner preferences" title="Settings" description="These preferences are stored locally with the rest of the planner and are included in exported backups." action={<Settings size={18} />} /></Panel>

    <div className="settings-grid">
      <Panel>
        <SectionHeading title="Appearance" description="Control how much information fits on screen." action={<Eye size={17} />} />
        <div className="form-grid form-grid-2">
          <Field label="Theme"><select value={state.settings.theme} onChange={(event) => update("theme", event.target.value as AppSettings["theme"])}><option value="system">Follow device</option><option value="light">Light</option><option value="dark">Dark</option></select></Field>
          <Field label="Interface density"><select value={state.settings.density} onChange={(event) => update("density", event.target.value as AppSettings["density"])}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></Field>
        </div>
        <div className="setting-toggles">
          <label><input type="checkbox" checked={state.settings.reduceMotion} onChange={(event) => update("reduceMotion", event.target.checked)} /><span><strong>Reduce motion</strong><small>Disable nonessential transitions and animated emphasis.</small></span></label>
          <label><input type="checkbox" checked={state.settings.showRaceDetails} onChange={(event) => update("showRaceDetails", event.target.checked)} /><span><strong>Show detailed helper text</strong><small>Keep distance, surface, and longer compatibility explanations visible.</small></span></label>
        </div>
      </Panel>

      <Panel>
        <SectionHeading title="Race planner" description="Choose how the rotation calendar behaves." action={<CalendarDays size={17} />} />
        <div className="form-grid form-grid-2">
          <Field label="Default calendar year"><select value={state.settings.defaultRaceYear} onChange={(event) => update("defaultRaceYear", Number(event.target.value) as AppSettings["defaultRaceYear"])}><option value={1}>Junior</option><option value={2}>Classic</option><option value={3}>Senior</option></select></Field>
          <Field label="Suggested G1 route length"><select value={state.settings.suggestedRouteLength} onChange={(event) => update("suggestedRouteLength", Number(event.target.value) as AppSettings["suggestedRouteLength"])}><option value={6}>6 races</option><option value={9}>9 races</option><option value={12}>12 races</option></select></Field>
        </div>
        <div className="setting-toggles"><label><input type="checkbox" checked={state.settings.showRaceIcons} onChange={(event) => update("showRaceIcons", event.target.checked)} /><span><strong>Show race artwork</strong><small>Display built-in race icons in the calendar and race lists.</small></span></label></div>
      </Panel>

      <Panel>
        <SectionHeading title="Trainees and recommendations" description="Tune visual sorting and how many saved-parent suggestions are shown." action={<SlidersHorizontal size={17} />} />
        <div className="form-grid form-grid-2"><Field label="Saved-pair recommendations"><select value={state.settings.recommendationCount} onChange={(event) => update("recommendationCount", Number(event.target.value) as AppSettings["recommendationCount"])}><option value={4}>Top 4</option><option value={6}>Top 6</option><option value={8}>Top 8</option></select></Field></div>
        <div className="setting-toggles">
          <label><input type="checkbox" checked={state.settings.ownedCardsFirst} onChange={(event) => update("ownedCardsFirst", event.target.checked)} /><span><strong>Put owned trainees first</strong><small>Owned trainee versions appear before unowned versions in visual pickers.</small></span></label>
          <label><input type="checkbox" checked={state.settings.showOnlyOwnedTargets} onChange={(event) => update("showOnlyOwnedTargets", event.target.checked)} /><span><strong>Only show owned trainees for family targets</strong><small>Hide unowned trainee versions from the target picker.</small></span></label>
        </div>
      </Panel>

      <Panel>
        <SectionHeading title="Safety and local data" description="Manage confirmations and see what is stored in this browser." action={<ShieldCheck size={17} />} />
        <div className="setting-toggles"><label><input type="checkbox" checked={state.settings.confirmDeletes} onChange={(event) => update("confirmDeletes", event.target.checked)} /><span><strong>Confirm veteran deletion</strong><small>Ask before permanently removing a saved veteran record.</small></span></label></div>
        <div className="settings-data-summary"><div><Database size={15} /><span><strong>{state.veterans.length}</strong><small>saved veterans</small></span></div><div><strong>{state.ownedCardIds.length}</strong><small>owned trainees</small></div><div><strong>{cards.length}</strong><small>Global trainee versions</small></div><div><strong>{characters.length}</strong><small>identities</small></div><div><strong>{gradedRaces.length}</strong><small>graded race entries</small></div></div>
        <Button variant="secondary" icon={RotateCcw} onClick={resetSettings}>Reset settings only</Button>
      </Panel>
    </div>
  </div>;
}
