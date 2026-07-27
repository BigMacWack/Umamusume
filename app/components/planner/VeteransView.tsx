"use client";

import { Plus, Save, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { cardById, characterName, type GradedRace } from "../../lib/data";
import { APTITUDE_NAMES, STAT_NAMES, type AppSettings, type AppState, type Spark, type SparkStars, type Veteran } from "../../lib/types";
import {
  Badge,
  Button,
  CardPicker,
  CharacterMark,
  emptyVeteran,
  Field,
  Panel,
  RaceSelector,
  SectionHeading,
  slotKeys,
  StarSelect,
  type StateSetter,
} from "./shared";

function WhiteSparkEditor({ sparks, onChange }: { sparks: Spark[]; onChange: (sparks: Spark[]) => void }) {
  const update = (index: number, patch: Partial<Spark>) => onChange(sparks.map((spark, current) => current === index ? { ...spark, ...patch } : spark));
  return <div className="white-spark-editor">
    <div className="subheading-row"><h3 className="subheading">White factors</h3><Button variant="secondary" icon={Plus} onClick={() => onChange([...sparks, { type: "", stars: 1 }])}>Add factor</Button></div>
    {sparks.length ? <div className="white-spark-list">{sparks.map((spark, index) => <div className="white-spark-row" key={`${index}-${spark.type}`}>
      <input aria-label={`White factor ${index + 1}`} value={spark.type} onChange={(event) => update(index, { type: event.target.value })} placeholder="Race, skill, or scenario factor" />
      <StarSelect value={spark.stars} onChange={(stars) => update(index, { stars })} label={`White factor ${index + 1} stars`} />
      <button type="button" onClick={() => onChange(sparks.filter((_, current) => current !== index))} aria-label={`Remove white factor ${index + 1}`}><X size={14} /></button>
    </div>)}</div> : <p className="empty-inline">No white factors recorded.</p>}
  </div>;
}

function VeteranEditor({ draft, veterans, settings, onChange, onSave, onCancel }:
  { draft: Veteran; veterans: Veteran[]; settings: AppSettings; onChange: (draft: Veteran) => void; onSave: () => void; onCancel: () => void }) {
  const update = <K extends keyof Veteran>(key: K, value: Veteran[K]) => onChange({ ...draft, [key]: value, updatedAt: new Date().toISOString() });
  const toggleRace = (race: GradedRace) => update("raceIds", draft.raceIds.includes(race.id) ? draft.raceIds.filter((id) => id !== race.id) : [...draft.raceIds, race.id]);
  const possibleParents = veterans.filter((veteran) => veteran.id !== draft.id && veteran.charId !== draft.charId);
  return <Panel className="editor-panel">
    <SectionHeading title={veterans.some((item) => item.id === draft.id) ? "Edit veteran" : "New veteran"} description="Record the exact 1★–3★ factors shown on the completed career." action={<Button variant="ghost" onClick={onCancel}>Close</Button>} />
    <div className="form-grid form-grid-2">
      <div className="field"><span>Trainee card</span><CardPicker value={draft.cardId} onChange={(cardId) => { const card = cardById.get(cardId); if (card) onChange({ ...draft, cardId, charId: card.charId, updatedAt: new Date().toISOString() }); }} label="Veteran trainee" /></div>
      <Field label="Nickname"><input value={draft.nickname} onChange={(event) => update("nickname", event.target.value)} placeholder="Optional label" /></Field>
      <Field label="Scenario"><input value={draft.scenario} onChange={(event) => update("scenario", event.target.value)} /></Field>
      <Field label="Evaluation score"><input type="number" min="0" value={draft.score ?? ""} onChange={(event) => update("score", event.target.value ? Number(event.target.value) : null)} /></Field>
    </div>
    <h3 className="subheading">Final stats</h3>
    <div className="stat-input-grid">{STAT_NAMES.map((stat, index) => <Field key={stat} label={stat}><input type="number" min="0" value={draft.finalStats[index]} onChange={(event) => { const stats = [...draft.finalStats] as Veteran["finalStats"]; stats[index] = Number(event.target.value); update("finalStats", stats); }} /></Field>)}</div>
    <h3 className="subheading">Inheritance factors</h3>
    <div className="factor-editor-grid">
      <Field label="Blue factor"><select value={draft.blueSpark.type} onChange={(event) => update("blueSpark", { ...draft.blueSpark, type: event.target.value })}>{STAT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Blue stars"><StarSelect value={draft.blueSpark.stars} onChange={(stars) => update("blueSpark", { ...draft.blueSpark, stars })} label="Blue factor stars" /></Field>
      <Field label="Pink factor"><select value={draft.pinkSpark.type} onChange={(event) => update("pinkSpark", { ...draft.pinkSpark, type: event.target.value })}>{APTITUDE_NAMES.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Pink stars"><StarSelect value={draft.pinkSpark.stars} onChange={(stars) => update("pinkSpark", { ...draft.pinkSpark, stars })} label="Pink factor stars" /></Field>
      <Field label="Green unique factor"><input value={draft.greenSpark.type} onChange={(event) => update("greenSpark", { ...draft.greenSpark, type: event.target.value })} placeholder="Unique skill name" /></Field>
      <Field label="Green stars"><StarSelect value={draft.greenSpark.stars} onChange={(stars: SparkStars) => update("greenSpark", { ...draft.greenSpark, stars })} label="Green factor stars" /></Field>
    </div>
    <WhiteSparkEditor sparks={draft.whiteSparks} onChange={(whiteSparks) => update("whiteSparks", whiteSparks)} />
    <h3 className="subheading">Recorded lineage</h3>
    <div className="form-grid form-grid-2">
      {(["parent1Id", "parent2Id"] as const).map((key, index) => <Field key={key} label={`Parent ${index + 1}`}><select value={draft[key]} onChange={(event) => update(key, event.target.value)}><option value="">Unknown / not recorded</option>{possibleParents.map((veteran) => <option key={veteran.id} value={veteran.id}>{veteran.nickname || characterName(veteran.charId)}</option>)}</select></Field>)}
      <Field label="Tags" hint="Comma-separated"><input value={draft.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /></Field>
      <Field label="Notes"><textarea rows={3} value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></Field>
    </div>
    <h3 className="subheading">Graded race wins</h3>
    <RaceSelector selectedIds={draft.raceIds} onToggle={toggleRace} compact showIcons={settings.showRaceIcons} showDetails={settings.showRaceDetails} />
    <div className="editor-actions"><Button icon={Save} onClick={onSave}>Save veteran</Button><Button variant="secondary" onClick={onCancel}>Cancel</Button></div>
  </Panel>;
}

export default function VeteransView({ state, setState }: { state: AppState; setState: StateSetter }) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Veteran | null>(null);
  const filtered = state.veterans.filter((veteran) => {
    const card = cardById.get(veteran.cardId);
    return `${veteran.nickname} ${card?.name ?? ""} ${card?.outfit ?? ""} ${veteran.tags.join(" ")} ${veteran.blueSpark.type} ${veteran.pinkSpark.type} ${veteran.greenSpark.type} ${veteran.whiteSparks.map((spark) => spark.type).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  const saveDraft = () => {
    if (!draft) return;
    const cleaned = { ...draft, whiteSparks: draft.whiteSparks.filter((spark) => spark.type.trim()) };
    setState((current) => ({ ...current, veterans: current.veterans.some((veteran) => veteran.id === cleaned.id) ? current.veterans.map((veteran) => veteran.id === cleaned.id ? cleaned : veteran) : [cleaned, ...current.veterans] }));
    setDraft(null);
  };
  const deleteVeteran = (id: string) => {
    if (state.settings.confirmDeletes && !confirm("Delete this veteran record?")) return;
    setState((current) => ({
      ...current,
      veterans: current.veterans.filter((veteran) => veteran.id !== id).map((veteran) => ({ ...veteran, parent1Id: veteran.parent1Id === id ? "" : veteran.parent1Id, parent2Id: veteran.parent2Id === id ? "" : veteran.parent2Id })),
      family: { ...current.family, slots: Object.fromEntries(slotKeys.map((key) => [key, current.family.slots[key].veteranId === id ? { charId: current.family.slots[key].charId, veteranId: "" } : current.family.slots[key]])) as AppState["family"]["slots"] },
    }));
    if (draft?.id === id) setDraft(null);
  };
  return <div className="view-stack">
    <Panel><SectionHeading title="Veteran library" description="Every blue, pink, green, and white factor can be recorded at 1★, 2★, or 3★." action={<Button icon={Plus} onClick={() => setDraft(emptyVeteran())}>New veteran</Button>} /><label className="search-box full-width"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, factors, or tags" /></label></Panel>
    <div className={`library-layout ${draft ? "with-editor" : ""}`}>
      <Panel><div className="veteran-list">{filtered.length ? filtered.map((veteran) => {
        const card = cardById.get(veteran.cardId);
        return <article className="veteran-row" key={veteran.id}>
          <CharacterMark charId={veteran.charId} cardId={veteran.cardId} />
          <div className="veteran-main"><div><h3>{veteran.nickname || card?.name || "Veteran"}</h3><Badge tone="blue">{veteran.blueSpark.type} {veteran.blueSpark.stars}★</Badge><Badge tone="coral">{veteran.pinkSpark.type} {veteran.pinkSpark.stars}★</Badge>{veteran.greenSpark.type ? <Badge tone="gold">{veteran.greenSpark.stars}★ unique</Badge> : null}</div><p>{card?.outfit} · {veteran.scenario}{veteran.score !== null ? ` · ${veteran.score}` : ""}</p><span>{veteran.raceIds.length} graded wins · {veteran.whiteSparks.length} white factors · {veteran.tags.join(" · ") || "no tags"}</span></div>
          <div className="row-actions"><Button variant="secondary" onClick={() => setDraft({ ...veteran, finalStats: [...veteran.finalStats] as Veteran["finalStats"], raceIds: [...veteran.raceIds], tags: [...veteran.tags], greenSpark: { ...veteran.greenSpark }, whiteSparks: veteran.whiteSparks.map((spark) => ({ ...spark })) })}>Edit</Button><Button variant="ghost" className="icon-button" onClick={() => deleteVeteran(veteran.id)} title="Delete veteran"><Trash2 size={15} /></Button></div>
        </article>;
      }) : <p className="empty-state">No veteran records match this search.</p>}</div></Panel>
      {draft ? <VeteranEditor draft={draft} veterans={state.veterans} settings={state.settings} onChange={setDraft} onSave={saveDraft} onCancel={() => setDraft(null)} /> : null}
    </div>
  </div>;
}
