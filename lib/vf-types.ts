// ── VibeForge Data Model ─────────────────────────────────────────────────────

// ── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string
  purpose: ProjectPurpose
  desiredOutput: OutputType
  jtbd: JTBDStatement | null
  businessObjectives: string[]
  screens: Screen[]
  flows: Flow[]
  moodBoardRefs: MoodBoardRef[]
  recipeCategoryId: string | null
  selectedBlockIds: string[]
  createdAt: string
  updatedAt: string
}

export type ProjectPurpose =
  | 'brainstorming'
  | 'user_testing'
  | 'pitch_deck'
  | 'production_handoff'
  | 'stakeholder_review'
  | 'exploration'

export type OutputType =
  | 'ux_brief_with_visuals'
  | 'pitch_deck_slides'
  | 'figma_import'
  | 'interactive_prototype'
  | 'flow_documentation'
  | 'screens_only'

export interface JTBDStatement {
  situation: string   // "When I..."
  motivation: string  // "I want to..."
  outcome: string     // "So I can..."
  raw: string         // full text form
}

// ── Screen ───────────────────────────────────────────────────────────────────

export interface Screen {
  id: string
  name: string
  jtbdAttachment: string
  businessGoal: string
  breadboard: BreadboardData | null
  fatMarker: FatMarkerData | null
  hifi: HiFiData | null
  currentFidelity: FidelityLevel
}

export type FidelityLevel = 'breadboard' | 'fatMarker' | 'hifi'

// ── Breadboard Layer ─────────────────────────────────────────────────────────

export interface BreadboardData {
  id: string
  name: string
  description: string
  places: Place[]
  affordances: Affordance[]
  connections: Connection[]
}

export interface Place {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface Affordance {
  id: string
  label: string
  placeId: string
  type: 'button' | 'field' | 'link' | 'display' | 'toggle'
}

export interface Connection {
  id: string
  fromPlaceId: string
  fromAffordanceId?: string
  toPlaceId: string
  label?: string
}

// ── Fat Marker Layer ─────────────────────────────────────────────────────────

export interface FatMarkerData {
  id: string
  name: string
  description: string
  regions: LayoutRegion[]
  palette: string[]
  typographyHints: {
    headingWeight: 'light' | 'regular' | 'bold'
    bodySize: 'small' | 'medium' | 'large'
  }
}

export interface LayoutRegion {
  id: string
  label: string
  type: 'header' | 'hero' | 'content' | 'sidebar' | 'footer' | 'cta' | 'nav' | 'form' | 'list' | 'media'
  x: number
  y: number
  width: number
  height: number
  affordanceIds: string[]
}

// ── Hi-Fi Layer ──────────────────────────────────────────────────────────────

export interface HiFiData {
  id: string
  name: string
  description: string
  html: string
  css: string
  moodBoardInfluence: string[]
}

// ── Flow ─────────────────────────────────────────────────────────────────────

export interface Flow {
  id: string
  name: string
  steps: FlowStep[]
  jtbd: string
}

export interface FlowStep {
  screenId: string
  transitionLabel: string
  notes?: string
}

// ── Mood Board ───────────────────────────────────────────────────────────────

export interface MoodBoardRef {
  id: string
  type: 'image' | 'palette' | 'typography' | 'url' | 'text'
  value: string
  tags: string[]
}

// ── History ──────────────────────────────────────────────────────────────────

export interface HistorySnapshot {
  id: string
  timestamp: string
  phase: DesignPhase
  label: string
  projectState: string  // JSON-serialized Project
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    phase?: DesignPhase
    agentId?: string
    changesSummary?: string[]
  }
}

// ── Phase ────────────────────────────────────────────────────────────────────

export type DesignPhase = 'setup' | 'breadboard' | 'fatMarker' | 'hifi' | 'export'

// ── Voting ───────────────────────────────────────────────────────────────────

export type VariantVote = 'up' | 'down' | 'star'

export type DownvoteCategory =
  | 'too-complex'
  | 'too-simple'
  | 'wrong-flow'
  | 'missing-screens'
  | 'confusing'
  | 'other'

// ── Helpers ──────────────────────────────────────────────────────────────────

export function createId(): string {
  return crypto.randomUUID()
}

export function createProject(partial: {
  name: string
  description: string
  purpose?: ProjectPurpose
  desiredOutput?: OutputType
  recipeCategoryId?: string | null
  selectedBlockIds?: string[]
}): Project {
  const now = new Date().toISOString()
  return {
    id: createId(),
    name: partial.name,
    description: partial.description,
    purpose: partial.purpose ?? 'exploration',
    desiredOutput: partial.desiredOutput ?? 'screens_only',
    jtbd: null,
    businessObjectives: [],
    screens: [],
    flows: [],
    moodBoardRefs: [],
    recipeCategoryId: partial.recipeCategoryId ?? null,
    selectedBlockIds: partial.selectedBlockIds ?? [],
    createdAt: now,
    updatedAt: now,
  }
}
