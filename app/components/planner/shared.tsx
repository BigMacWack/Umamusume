"use client";

import {
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Database,
  Download,
  FileUp,
  GitBranch,
  Home,
  Library,
  RotateCcw,
  Search,
  Settings,
} from "lucide-react";
import {
  calendarLabel,
  cardById,
  cardPortraitUrl,
  cards,
  cardsByCharacter,
  characterName,
  characters,
  distanceBand,
  gradedRaces,
  raceBannerUrl,
  type GradedRace,
  type TraineeCard,
} from "../../lib/data";
import type {
  AppState,
  AppView,
  FamilySlotKey,
  PlannerSlot,
  SparkStars,
  Veteran,
} from "../../lib/types";
import { downloadBackup } from "../../lib/storage";

export type IconComponent = ComponentType<{ size?: number; strokeWidth?: number }>;
export type StateSetter = React.Dispatch<React.SetStateAction<AppState>>;

export const navItems: { id: AppView; label: string; icon: IconComponent }[] = [
  { id: "planner", label: "Family planner", icon: GitBranch },
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "veterans", label: "Veteran library", icon: Library },
  { id: "races", label: "Race planner", icon: CalendarDays },
  { id: "roster", label: "Trainee database", icon: Database },
  { id: "guide", label: "Guide & rules", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

export const slotLabels: Record<FamilySlotKey, string> = {
  parent1: "Parent 1",
  grandparent1A: "Grandparent 1A",
  grandparent1B: "Grandparent 1B",
  parent2: "Parent 2",
  grandparent2A: "Grandparent 2A",
  grandparent2B: "Grandparent 2B",
};
export const slotKeys = Object.keys(slotLabels) as FamilySlotKey[];

const createLocalId = () => globalThis.crypto?.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export const emptyVeteran = (cardId = cards[0]?.cardId ?? 0): Veteran => {
  const card = cardById.get(cardId) ?? cards[0];
  const now = new Date().toISOString();
  return {
    id: createLocalId(), nickname: "", cardId: card?.cardId ?? 0,
    charId: card?.charId ?? 0, scenario: "Grand Live", score: null,
    finalStats: [0, 0, 0, 0, 0], blueSpark: { type: "Stamina", stars: 3 },
    pinkSpark: { type: "Medium", stars: 3 }, greenSpark: { type: "", stars: 1 }, whiteSparks: [],
    raceIds: [], parent1Id: "", parent2Id: "", tags: [], notes: "",
    createdAt: now, updatedAt: now,
  };
};

export function Button({ children, icon: Icon, variant = "primary", className = "", ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconComponent; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`button button-${variant} ${className}`.trim()} type="button" {...props}>{Icon ? <Icon size={15} /> : null}{children}</button>;
}
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
}
export function SectionHeading({ eyebrow, title, description, action }:
  { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div className="section-action">{action}</div> : null}</div>;
}
export function Field({ label, hint, children, className = "" }:
  { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={`field ${className}`.trim()}><span>{label}{hint ? <small>{hint}</small> : null}</span>{children}</label>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "mint" | "gold" | "coral" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StarSelect({ value, onChange, label = "Stars" }:
  { value: SparkStars; onChange: (stars: SparkStars) => void; label?: string }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(Number(event.target.value) as SparkStars)}>
    <option value={1}>1★</option><option value={2}>2★</option><option value={3}>3★</option>
  </select>;
}

export function CharacterMark({ charId, cardId, size = "normal" }:
  { charId: number; cardId?: number; size?: "small" | "normal" | "large" }) {
  const name = characterName(charId);
  const card = (cardId ? cardById.get(cardId) : undefined) ?? cardsByCharacter.get(charId)?.[0];
  const imageUrl = card ? cardPortraitUrl(card) : "";
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const failed = Boolean(imageUrl && failedUrl === imageUrl);
  return <span className={`character-mark mark-${size}`} title={name} aria-label={name}>
    {card && !failed ? <img src={imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(imageUrl)} /> : <span aria-hidden="true">{initials || "?"}</span>}
  </span>;
}

export function RaceMark({ race, size = "normal", showImage = true }:
  { race: GradedRace; size?: "small" | "normal" | "wide"; showImage?: boolean }) {
  const imageUrl = raceBannerUrl(race);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl === imageUrl;
  return <span className={`race-mark race-mark-${size} grade-${race.grade.toLowerCase()}`} title={race.name}>
    {showImage && !failed ? <img src={imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(imageUrl)} /> : <strong>{race.grade}</strong>}
  </span>;
}

export function CardPicker({ value, onChange, ownedCardIds = [], ownedFirst = true, onlyOwned = false, label = "Trainee" }:
  { value: number; onChange: (cardId: number) => void; ownedCardIds?: number[]; ownedFirst?: boolean; onlyOwned?: boolean; label?: string }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const selected = cardById.get(value) ?? cards[0];
  const owned = useMemo(() => new Set(ownedCardIds), [ownedCardIds]);
  const options = useMemo(() => cards
    .filter((card) => !onlyOwned || owned.has(card.cardId))
    .filter((card) => `${card.name} ${card.outfit}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => {
      if (ownedFirst) {
        const ownedDifference = Number(owned.has(second.cardId)) - Number(owned.has(first.cardId));
        if (ownedDifference) return ownedDifference;
      }
      return first.name.localeCompare(second.name) || first.cardId - second.cardId;
    }), [onlyOwned, owned, ownedFirst, query]);
  const choose = (card: TraineeCard) => {
    onChange(card.cardId);
    setQuery("");
    if (details.current) details.current.open = false;
  };
  return <details ref={details} className="card-picker">
    <summary aria-label={label}><CharacterMark charId={selected?.charId ?? 0} cardId={selected?.cardId} /><span><small>{label}</small><strong>{selected?.name ?? "Choose trainee"}</strong><em>{selected?.outfit}</em></span></summary>
    <div className="card-picker-popover">
      <label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trainee or outfit" autoFocus /></label>
      <div className="card-picker-list">{options.length ? options.map((card) => <button key={card.cardId} type="button" className={card.cardId === value ? "selected" : ""} onClick={() => choose(card)}>
        <CharacterMark charId={card.charId} cardId={card.cardId} /><span><strong>{card.name}</strong><small>{card.outfit}</small></span>{owned.has(card.cardId) ? <Badge tone="mint">Owned</Badge> : null}
      </button>) : <p className="empty-state">No matching owned trainees.</p>}</div>
    </div>
  </details>;
}

export function AffinityMeter({ score, symbol, tier, compact = false }:
  { score: number; symbol: string; tier: string; compact?: boolean }) {
  const percent = Math.min(100, Math.round((score / 151) * 100));
  return <div className={`affinity-meter ${compact ? "is-compact" : ""}`}>
    <div className="meter-score"><span>{symbol}</span><strong>{score}</strong><small>{tier} compatibility</small></div>
    <div className="meter-track"><span style={{ width: `${percent}%` }} /></div>
    <div className="meter-labels"><span>△ 0–50</span><span>○ 51–150</span><span>◎ 151+</span></div>
  </div>;
}

export function HeaderActions({ state, onImport, onReset }:
  { state: AppState; onImport: (event: ChangeEvent<HTMLInputElement>) => void; onReset: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="header-actions">
    <span className="save-state"><Check size={13} /> Saved locally</span>
    <Button variant="ghost" icon={Download} onClick={() => downloadBackup(state)}>Export</Button>
    <Button variant="ghost" icon={FileUp} onClick={() => input.current?.click()}>Import</Button>
    <Button variant="ghost" icon={RotateCcw} onClick={onReset}>Reset</Button>
    <input ref={input} hidden type="file" accept="application/json" onChange={onImport} />
  </div>;
}

export function LineageSelect({ label, slot, veterans, onChange }:
  { label: string; slot: PlannerSlot; veterans: Veteran[]; onChange: (slot: PlannerSlot) => void }) {
  const selected = veterans.find((veteran) => veteran.id === slot.veteranId);
  const charId = selected?.charId ?? slot.charId;
  const value = slot.veteranId ? `v:${slot.veteranId}` : slot.charId ? `c:${slot.charId}` : "";
  const selectedName = selected?.nickname || (charId ? characterName(charId) : "Unselected");
  const selectedDetail = selected
    ? `${selected.blueSpark.type} ${selected.blueSpark.stars}★ · ${selected.pinkSpark.type} ${selected.pinkSpark.stars}★${selected.greenSpark.type ? ` · ${selected.greenSpark.type} ${selected.greenSpark.stars}★` : ""}`
    : charId ? "Character identity only; no saved factors or race history" : "Choose a saved veteran or identity";
  return <div className={`lineage-select ${charId ? "has-selection" : "is-empty"}`}>
    <div className="lineage-label"><CharacterMark charId={charId} cardId={selected?.cardId} size="small" /><div><strong>{label}</strong><span>{selectedName}</span></div></div>
    <select aria-label={label} value={value} onChange={(event) => {
      const next = event.target.value;
      if (!next) return onChange({ charId: 0, veteranId: "" });
      if (next.startsWith("v:")) {
        const veteran = veterans.find((item) => item.id === next.slice(2));
        return onChange({ charId: veteran?.charId ?? 0, veteranId: veteran?.id ?? "" });
      }
      onChange({ charId: Number(next.slice(2)), veteranId: "" });
    }}>
      <option value="">Unselected</option>
      {veterans.length ? <optgroup label="Saved veterans">{veterans.map((veteran) => <option key={veteran.id} value={`v:${veteran.id}`}>{veteran.nickname || characterName(veteran.charId)} · {veteran.blueSpark.type} {veteran.blueSpark.stars}★ · {veteran.pinkSpark.type} {veteran.pinkSpark.stars}★</option>)}</optgroup> : null}
      <optgroup label="Character identity">{characters.map((character) => <option key={character.id} value={`c:${character.id}`}>{character.name}</option>)}</optgroup>
    </select>
    <small>{selectedDetail}</small>
  </div>;
}

export function RaceSelector({ selectedIds, onToggle, compact = false, showIcons = true, showDetails = true }:
  { selectedIds: string[]; onToggle: (race: GradedRace) => void; compact?: boolean; showIcons?: boolean; showDetails?: boolean }) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("All");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return gradedRaces.filter((race) => (grade === "All" || race.grade === grade) && (!normalized || `${race.name} ${calendarLabel(race)} ${race.surface} ${distanceBand(race.distance)}`.toLowerCase().includes(normalized)));
  }, [grade, query]);
  return <div className={`race-selector ${compact ? "compact" : ""}`}>
    <div className="filter-row"><label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search races" /></label><select value={grade} onChange={(event) => setGrade(event.target.value)}><option>All</option><option>G1</option><option>G2</option><option>G3</option></select></div>
    <div className="race-option-list">{filtered.map((race) => {
      const checked = selectedIds.includes(race.id);
      return <label className={`race-option ${checked ? "selected" : ""}`} key={race.id}><input type="checkbox" checked={checked} onChange={() => onToggle(race)} />{showIcons ? <RaceMark race={race} size="small" /> : null}<span><strong>{race.name}</strong>{showDetails ? <small>{calendarLabel(race)} · {race.grade} · {race.surface} {race.distance}m ({distanceBand(race.distance)})</small> : null}</span></label>;
    })}</div>
  </div>;
}
