"use client";

import { Plus, Save, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { cardById, cardLabel, cards, characterName, type GradedRace } from "../../lib/data";
import { APTITUDE_NAMES, STAT_NAMES, type AppState, type Veteran } from "../../lib/types";
import {
  Badge,
  Button,
  CharacterMark,
  emptyVeteran,
  Field,
  Panel,
  RaceSelector,
  SectionHeading,
  slotKeys,
  type StateSetter,
} from "./shared";

function VeteranEditor({ draft, veterans, onChange, onSave, onCancel }:
  { draft: Veteran; veterans: Veteran[]; onChange: (draft: Veteran) => void; onSave: () => void; onCancel: () => void }) {
  const update = <K extends keyof Veteran>(key: K, value: Veteran[K]) => onChange({ ...draft, [key]: value, updatedAt: new Date().toISOString() });
  const toggleRace = (race: GradedRace) => update("raceIds", draft.raceIds.includes(race.id) ? draft.raceIds.filter((id) => id !== race.id) : [...draft.raceIds, race.id]);
  const possibleParents = veterans.filter((veteran) => veteran.id !== draft.id && veteran.charId !== draft.charId);
  return <Panel className="editor-panel">
    <SectionHeading title={veterans.some((item) => item.id === draft.id) ? "Edit veteran" : "New veteran"} action={<Button variant="ghost" onClick={onCancel}>Close</Button>} />
    <div className="form-grid form-grid-2">
      <Field label="Trainee card"><select value={draft.cardId} onChange={(event) => { const card = cardById.get(Number(event.target.value)); if (card) onChange({ ...draft, cardId: card.cardId, charId: card.charId, updatedAt: new Date().toISOString() }); }}>{cards.map((card) => <option key={card.cardId} value={card.cardId}>{cardLabel(card)}</option>)}</select></Field>
      <Field label="Nickname"><input value={draft.nickname} onChange={(event) => update("nickname", event.target.value)} placeholder="Optional label" /></Field>
      <Field label="Scenario"><input value={draft.scenario} onChange={(event) => update("scenario", event.target.value)} /></Field>
      <Field label="Evaluation score"><input type="number" min="0" value={draft.score ?? ""} onChange={(event) => update("score", event.target.value ? Number(event.target.value) : null)} /></Field>
    </div>
    <h3 className="subheading">Final stats</h3>
    <div className="stat-input-grid">{STAT_NAMES.map((stat, index) => <Field key={stat} label={stat}><input type="number" min="0" value={draft.finalStats[index]} onChange={(event) => { const stats = [...draft.finalStats] as Veteran["finalStats"]; stats[index] = Number(event.target.value); update("finalStats", stats); }} /></Field>)}</div>
    <div className="form-grid form-grid-3 spark-grid">
      <Field label="Blue spark"><select value={draft.blueSpark.type} onChange={(event) => update("blueSpark", { ...draft.blueSpark, type: event.target.value })}>{STAT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Blue stars"><select value={draft.blueSpark.stars} onChange={(event) => update("blueSpark", { ...draft.blueSpark, stars: Number(event.target.value) as 1 | 2 | 3 })}><option value={1}>1★</option><option value={2}>2★</option><option value={3}>3★</option></select></Field>
      <Field label="Green skill"><input value={draft.greenSkill} onChange={(event) => update("greenSkill", event.target.value)} /></Field>
      <Field label="Pink spark"><select value={draft.pinkSpark.type} onChange={(event) => update("pinkSpark", { ...draft.pinkSpark, type: event.target.value })}>{APTITUDE_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Pink stars"><select value={draft.pinkSpark.stars} onChange={(event) => update("pinkSpark", { ...draft.pinkSpark, stars: Number(event.target.value) as 1 | 2 | 3 })}><option value={1}>1★</option><option value={2}>2★</option><option value={3}>3★</option></select></Field>
      <Field label="White sparks" hint="Comma-separated"><input value={draft.whiteSparks.join(", ")} onChange={(event) => update("whiteSparks", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /></Field>
    </div>
    <h3 className="subheading">Recorded lineage</h3>
    <div className="form-grid form-grid-2">
      {(["parent1Id", "parent2Id"] as const).map((key, index) => <Field key={key} label={`Parent ${index + 1}`}><select value={draft[key]} onChange={(event) => update(key, event.target.value)}><option value="">Unknown / not recorded</option>{possibleParents.map((veteran) => <option key={veteran.id} value={veteran.id}>{veteran.nickname || characterName(veteran.charId)}</option>)}</select></Field>)}
      <Field label="Tags" hint="Comma-separated"><input value={draft.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /></Field>
      <Field label="Notes"><textarea rows={3} value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></Field>
    </div>
    <h3 className="subheading">Graded race wins</h3>
    <RaceSelector selectedIds={draft.raceIds} onToggle={toggleRace} compact />
    <div className="editor-actions"><Button icon={Save} onClick={onSave}>Save veteran</Button><Button variant="secondary" onClick={onCancel}>Cancel</Button></div>
  </Panel>;
}

export default function VeteransView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Veteran | null>(null);
  const filtered = state.veterans.filter((veteran) => {
    const card = cardById.get(veteran.cardId);
    return `${veteran.nickname} ${card?.name ?? ""} ${card?.outfit ?? ""} ${veteran.tags.join(" ")} ${veteran.blueSpark.type} ${veteran.pinkSpark.type}`.toLowerCase().includes(query.toLowerCase());
  });
  const saveDraft = () => {
    if (!draft) return;
    setState((current) => ({ ...current, veterans: current.veterans.some((veteran) => veteran.id === draft.id) ? current.veterans.map((veteran) => veteran.id === draft.id ? draft : veteran) : [draft, ...current.veterans] }));
    setDraft(null);
  };
  const deleteVeteran = (id: string) => {
    if (!confirm("Delete this veteran record?")) return;
    setState((current) => ({
      ...current,
      veterans: current.veterans.filter((veteran) => veteran.id !== id).map((veteran) => ({ ...veteran, parent1Id: veteran.parent1Id === id ? "" : veteran.parent1Id, parent2Id: veteran.parent2Id === id ? "" : veteran.parent2Id })),
      family: { ...current.family, slots: Object.fromEntries(slotKeys.map((key) => [key, current.family.slots[key].veteranId === id ? { charId: current.family.slots[key].charId, veteranId: "" } : current.family.slots[key]])) as AppState["family"]["slots"] },
    }));
    if (draft?.id === id) setDraft(null);
  };
  return <div className="view-stack">
    <Panel><SectionHeading title="Veteran library" description="Records persist in this browser and can be exported as JSON." action={<Button icon={Plus} onClick={() => setDraft(emptyVeteran())}>New veteran</Button>} /><label className="search-box full-width"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, sparks, or tags" /></label></Panel>
    <div className={`library-layout ${draft ? "with-editor" : ""}`}>
      <Panel><div className="veteran-list">{filtered.length ? filtered.map((veteran) => {
        const card = cardById.get(veteran.cardId);
        return <article className="veteran-row" key={veteran.id}>
          <CharacterMark charId={veteran.charId} cardId={veteran.cardId} />
          <div className="veteran-main"><div><h3>{veteran.nickname || card?.name || "Veteran"}</h3><Badge tone="blue">{veteran.blueSpark.type} {veteran.blueSpark.stars}★</Badge><Badge tone="coral">{veteran.pinkSpark.type} {veteran.pinkSpark.stars}★</Badge></div><p>{card?.outfit} · {veteran.scenario}{veteran.score !== null ? ` · ${veteran.score}` : ""}</p><span>{veteran.raceIds.length} graded wins · {veteran.tags.join(" · ") || "no tags"}</span></div>
          <div className="row-actions"><Button variant="secondary" onClick={() => setDraft({ ...veteran, finalStats: [...veteran.finalStats] as Veteran["finalStats"], raceIds: [...veteran.raceIds], tags: [...veteran.tags], whiteSparks: [...veteran.whiteSparks] })}>Edit</Button><Button variant="ghost" className="icon-button" onClick={() => deleteVeteran(veteran.id)} title="Delete veteran"><Trash2 size={15} /></Button></div>
        </article>;
      }) : <p className="empty-state">No veteran records match this search.</p>}</div></Panel>
      {draft ? <VeteranEditor draft={draft} veterans={state.veterans} onChange={setDraft} onSave={saveDraft} onCancel={() => setDraft(null)} /> : null}
    </div>
  </div>;
}
