"use client";

import {
  Archive,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  FileUp,
  Flag,
  Gauge,
  GitBranch,
  Home,
  Info,
  Library,
  Menu,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { DATA_SNAPSHOT } from "../data/uma-data";
import {
  blueStartingBonus,
  blueThreeStarChance,
  calculateFamilyAffinity,
  CROWN_SETS,
  familyValidation,
  pairAffinity,
  startingAptitudeRanks,
} from "../lib/affinity";
import {
  calendarLabel,
  cardById,
  cardLabel,
  cards,
  cardsByCharacter,
  characterName,
  characters,
  distanceBand,
  gradedRaces,
  raceById,
  type GradedRace,
} from "../lib/data";
import {
  bestSavedParentPairs,
  familyFromParents,
  nextRunSuggestions,
  racePlanWarnings,
  suggestedG1Route,
} from "../lib/recommendations";
import {
  defaultState,
  downloadBackup,
  importBackup,
  loadState,
  saveState,
} from "../lib/storage";
import {
  APTITUDE_NAMES,
  STAT_NAMES,
  type AppState,
  type AppView,
  type AptitudeName,
  type FamilySlotKey,
  type PlannerSlot,
  type StatName,
  type Veteran,
} from "../lib/types";

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number }>;

const navItems: { id: AppView; label: string; icon: IconComponent }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "planner", label: "Family planner", icon: GitBranch },
  { id: "veterans", label: "Veteran library", icon: Library },
  { id: "races", label: "Race planner", icon: CalendarDays },
  { id: "roster", label: "Trainee database", icon: Database },
  { id: "guide", label: "Guide & rules", icon: BookOpen },
];

const slotLabels: Record<FamilySlotKey, string> = {
  parent1: "Parent 1",
  grandparent1A: "Grandparent 1A",
  grandparent1B: "Grandparent 1B",
  parent2: "Parent 2",
  grandparent2A: "Grandparent 2A",
  grandparent2B: "Grandparent 2B",
};

const slotKeys = Object.keys(slotLabels) as FamilySlotKey[];

const createLocalId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const emptyVeteran = (cardId = cards[0].cardId): Veteran => {
  const card = cardById.get(cardId) ?? cards[0];
  const now = new Date().toISOString();
  return {
    id: createLocalId(),
    nickname: "",
    cardId: card.cardId,
    charId: card.charId,
    scenario: "Grand Live",
    score: null,
    finalStats: [0, 0, 0, 0, 0],
    blueSpark: { type: "Stamina", stars: 3 },
    pinkSpark: { type: "Medium", stars: 3 },
    greenSkill: "",
    whiteSparks: [],
    raceIds: [],
    parent1Id: "",
    parent2Id: "",
    tags: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
};

function Button({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconComponent;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      type="button"
      {...props}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span>
        {label}
        {hint ? <small>{hint}</small> : null}
      </span>
      {children}
    </label>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "mint" | "gold" | "coral" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function CharacterMark({
  charId,
  size = "normal",
}: {
  charId: number;
  size?: "small" | "normal" | "large";
}) {
  const name = characterName(charId);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <span className={`character-mark mark-${size}`} aria-hidden="true">
      {initials || "?"}
    </span>
  );
}

function TargetSummary({ state }: { state: AppState }) {
  const target = cardById.get(state.family.targetCardId);
  if (!target) return null;
  const stats = target.fiveStar;
  return (
    <div className="target-summary">
      <CharacterMark charId={target.charId} size="large" />
      <div>
        <p className="eyebrow">Current target</p>
        <h3>{target.name}</h3>
        <p>{target.outfit}</p>
      </div>
      <div className="mini-stats" aria-label="Five star base stats">
        {STAT_NAMES.map((stat, index) => (
          <span key={stat}>
            <small>{stat.slice(0, 3)}</small>
            <strong>{stats[index]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function AffinityMeter({
  score,
  symbol,
  tier,
  compact = false,
}: {
  score: number;
  symbol: string;
  tier: string;
  compact?: boolean;
}) {
  const percent = Math.min(100, Math.round((score / 151) * 100));
  return (
    <div className={`affinity-meter ${compact ? "is-compact" : ""}`}>
      <div className="meter-score">
        <span>{symbol}</span>
        <strong>{score}</strong>
        <small>{tier} affinity</small>
      </div>
      <div className="meter-track">
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="meter-labels">
        <span>△ 0</span>
        <span>○ 51</span>
        <span>◎ 151+</span>
      </div>
    </div>
  );
}

function AppHeader({
  view,
  state,
  onImport,
  onReset,
  onToggleMenu,
}: {
  view: AppView;
  state: AppState;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onToggleMenu: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const current = navItems.find((item) => item.id === view) ?? navItems[0];
  return (
    <header className="app-header">
      <button
        className="mobile-menu"
        type="button"
        onClick={onToggleMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="header-title">
        <p>Umamusume Parent Lab</p>
        <h1>{current.label}</h1>
      </div>
      <div className="header-actions">
        <span className="save-state">
          <Check size={14} />
          Saved in this browser
        </span>
        <Button
          variant="ghost"
          icon={Download}
          onClick={() => downloadBackup(state)}
          title="Download a JSON backup"
        >
          Export
        </Button>
        <Button
          variant="ghost"
          icon={FileUp}
          onClick={() => fileInput.current?.click()}
          title="Restore a JSON backup"
        >
          Import
        </Button>
        <Button
          variant="ghost"
          icon={RotateCcw}
          onClick={onReset}
          title="Reset all locally saved planner data"
        >
          Reset
        </Button>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept="application/json"
          onChange={onImport}
        />
      </div>
    </header>
  );
}

function Sidebar({
  view,
  open,
  onSelect,
  onClose,
}: {
  view: AppView;
  open: boolean;
  onSelect: (view: AppView) => void;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Flag size={23} />
          </div>
          <div>
            <strong>Parent Lab</strong>
            <span>Global planner</span>
          </div>
          <button
            className="close-menu"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? "active" : ""}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {view === item.id ? <ChevronRight size={15} /> : null}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          <div>
            <strong>Global snapshot</strong>
            <span>{DATA_SNAPSHOT}</span>
          </div>
        </div>
      </aside>
      {open ? (
        <button
          className="sidebar-scrim"
          onClick={onClose}
          type="button"
          aria-label="Close navigation"
        />
      ) : null}
    </>
  );
}

function DashboardView({
  state,
  onNavigate,
  onUseSuggestion,
}: {
  state: AppState;
  onNavigate: (view: AppView) => void;
  onUseSuggestion: (charId: number, raceIds: string[]) => void;
}) {
  const affinity = calculateFamilyAffinity(state.family, state.veterans);
  const suggestions = nextRunSuggestions(state).slice(0, 3);
  const savedRaceCount = new Set(
    state.veterans.flatMap((veteran) =>
      veteran.raceIds.map((id) => raceById.get(id)?.name).filter(Boolean),
    ),
  ).size;

  return (
    <div className="view-stack">
      <Panel className="hero-panel">
        <div className="hero-copy">
          <Badge tone="mint">Global · Data through {DATA_SNAPSHOT}</Badge>
          <h2>Build the lineage before you spend the run.</h2>
          <p>
            Plan exact affinity, keep a searchable veteran library, and turn
            your current collection into the clearest next parent-farming run.
          </p>
          <div className="hero-actions">
            <Button icon={GitBranch} onClick={() => onNavigate("planner")}>
              Open family planner
            </Button>
            <Button
              icon={Plus}
              variant="secondary"
              onClick={() => onNavigate("veterans")}
            >
              Add a veteran
            </Button>
          </div>
        </div>
        <div className="hero-score">
          <span>Current family</span>
          <AffinityMeter
            score={affinity.total}
            symbol={affinity.symbol}
            tier={affinity.tier}
            compact
          />
        </div>
      </Panel>

      <div className="metric-grid">
        <Panel className="metric-card">
          <span className="metric-icon mint">
            <Archive size={19} />
          </span>
          <div>
            <small>Saved veterans</small>
            <strong>{state.veterans.length}</strong>
            <span>persistent in this browser</span>
          </div>
        </Panel>
        <Panel className="metric-card">
          <span className="metric-icon gold">
            <Trophy size={19} />
          </span>
          <div>
            <small>Unique graded wins</small>
            <strong>{savedRaceCount}</strong>
            <span>across your veteran library</span>
          </div>
        </Panel>
        <Panel className="metric-card">
          <span className="metric-icon coral">
            <Sparkles size={19} />
          </span>
          <div>
            <small>Race/title bonus</small>
            <strong>
              +{affinity.sharedRaceBonus + affinity.sharedCrownBonus}
            </strong>
            <span>in the current family</span>
          </div>
        </Panel>
        <Panel className="metric-card">
          <span className="metric-icon blue">
            <Target size={19} />
          </span>
          <div>
            <small>Farm goal</small>
            <strong className="metric-text">{state.family.targetBlue}</strong>
            <span>{state.family.targetPink} pink spark</span>
          </div>
        </Panel>
      </div>

      <div className="dashboard-grid">
        <Panel className="dashboard-main">
          <SectionHeading
            eyebrow="Recommendation engine"
            title="Best next trainees to farm"
            description="A transparent heuristic using target affinity, your saved links, growth bonuses, aptitude, and roster coverage."
            action={
              <Button
                variant="ghost"
                onClick={() => onNavigate("planner")}
              >
                Tune goals <ArrowRight size={15} />
              </Button>
            }
          />
          <div className="suggestion-list">
            {suggestions.map((suggestion, index) => (
              <article className="suggestion-card" key={suggestion.charId}>
                <span className="rank-number">0{index + 1}</span>
                <CharacterMark charId={suggestion.charId} />
                <div className="suggestion-copy">
                  <div>
                    <h3>{suggestion.name}</h3>
                    <Badge tone={index === 0 ? "mint" : "neutral"}>
                      Fit {suggestion.score}
                    </Badge>
                  </div>
                  <p>{suggestion.outfit}</p>
                  <ul>
                    {suggestion.reasons.slice(0, 2).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    onUseSuggestion(
                      suggestion.charId,
                      suggestion.suggestedRaceIds,
                    )
                  }
                >
                  Plan run
                </Button>
              </article>
            ))}
          </div>
        </Panel>

        <div className="dashboard-side">
          <Panel>
            <SectionHeading title="Target at a glance" />
            <TargetSummary state={state} />
            <div className="goal-pills">
              <span>
                <i className="dot dot-blue" />
                {state.family.targetBlue} blue
              </span>
              <span>
                <i className="dot dot-pink" />
                {state.family.targetPink} pink
              </span>
            </div>
          </Panel>
          <Panel className="checklist-panel">
            <SectionHeading title="Farm readiness" />
            {[
              {
                done: state.veterans.length >= 2,
                text: "At least two saved veterans",
              },
              {
                done: affinity.total >= 151,
                text: "Current family reaches ◎",
              },
              {
                done: affinity.sharedRaceBonus >= 3,
                text: "Three or more shared graded wins",
              },
              {
                done: state.racePlan.raceIds.length >= 6,
                text: "Next race route is planned",
              },
            ].map((item) => (
              <div className="check-row" key={item.text}>
                <span className={item.done ? "done" : ""}>
                  {item.done ? <Check size={13} /> : null}
                </span>
                <p>{item.text}</p>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function LineageSelect({
  label,
  slot,
  veterans,
  onChange,
}: {
  label: string;
  slot: PlannerSlot;
  veterans: Veteran[];
  onChange: (slot: PlannerSlot) => void;
}) {