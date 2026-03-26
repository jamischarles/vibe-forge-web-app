import { create } from 'zustand'
import {
  Project,
  Screen,
  BreadboardData,
  FatMarkerData,
  HiFiData,
  JTBDStatement,
  ChatMessage,
  HistorySnapshot,
  DesignPhase,
  VariantVote,
  createId,
  createProject,
} from './vf-types'

// ── Store Interface ──────────────────────────────────────────────────────────

interface VibeForgeStore {
  // Project state
  project: Project | null
  phase: DesignPhase

  // Breadboard voting
  breadboardVariants: BreadboardData[]
  breadboardRound: number
  variantVotes: Record<string, VariantVote>
  selectedVariantId: string | null

  // Fat marker voting
  fatMarkerVariants: FatMarkerData[]
  fatMarkerRound: number
  fatMarkerVotes: Record<string, VariantVote>
  selectedFatMarkerId: string | null

  // Hi-fi voting
  hifiVariants: HiFiData[]
  hifiRound: number
  hifiVotes: Record<string, VariantVote>
  selectedHifiId: string | null

  // Chat
  messages: ChatMessage[]
  isGenerating: boolean

  // History
  snapshots: HistorySnapshot[]

  // ── Actions ──────────────────────────────────────────────────────────────

  // Project
  initProject: (name: string, description: string) => void
  setJTBD: (jtbd: JTBDStatement) => void
  setScreens: (screens: Screen[]) => void
  updateProject: (partial: Partial<Project>) => void

  // Phase
  setPhase: (phase: DesignPhase) => void
  advancePhase: () => void

  // Breadboard voting
  setBreadboardVariants: (variants: BreadboardData[]) => void
  voteBreadboardVariant: (variantId: string, vote: VariantVote) => void
  selectBreadboardVariant: (variantId: string | null) => void
  commitBreadboard: (variant: BreadboardData) => void
  nextBreadboardRound: (newVariants: BreadboardData[]) => void

  // Fat marker voting
  setFatMarkerVariants: (variants: FatMarkerData[]) => void
  voteFatMarkerVariant: (variantId: string, vote: VariantVote) => void
  selectFatMarkerVariant: (variantId: string | null) => void
  commitFatMarker: (variant: FatMarkerData) => void

  // Hi-fi voting
  setHifiVariants: (variants: HiFiData[]) => void
  voteHifiVariant: (variantId: string, vote: VariantVote) => void
  selectHifiVariant: (variantId: string | null) => void
  commitHifi: (variant: HiFiData) => void

  // Chat
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setGenerating: (v: boolean) => void

  // History
  pushSnapshot: (label: string) => void

  // Reset
  resetProject: () => void
}

// ── Phase order ──────────────────────────────────────────────────────────────

const PHASE_ORDER: DesignPhase[] = ['setup', 'breadboard', 'fatMarker', 'hifi', 'export']

function nextPhase(current: DesignPhase): DesignPhase {
  const idx = PHASE_ORDER.indexOf(current)
  return idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : current
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<VibeForgeStore>()(
    (set, get) => ({
      // Initial state
      project: null,
      phase: 'setup',

      breadboardVariants: [],
      breadboardRound: 1,
      variantVotes: {},
      selectedVariantId: null,

      fatMarkerVariants: [],
      fatMarkerRound: 1,
      fatMarkerVotes: {},
      selectedFatMarkerId: null,

      hifiVariants: [],
      hifiRound: 1,
      hifiVotes: {},
      selectedHifiId: null,

      messages: [],
      isGenerating: false,

      snapshots: [],

      // ── Project actions ──────────────────────────────────────────────────

      initProject: (name, description) => {
        set({
          project: createProject({ name, description }),
          phase: 'setup',
          messages: [],
          breadboardVariants: [],
          breadboardRound: 1,
          variantVotes: {},
          selectedVariantId: null,
          fatMarkerVariants: [],
          fatMarkerRound: 1,
          fatMarkerVotes: {},
          selectedFatMarkerId: null,
          hifiVariants: [],
          hifiRound: 1,
          hifiVotes: {},
          selectedHifiId: null,
          snapshots: [],
        })
      },

      setJTBD: (jtbd) => {
        const project = get().project
        if (!project) return
        set({ project: { ...project, jtbd, updatedAt: new Date().toISOString() } })
      },

      setScreens: (screens) => {
        const project = get().project
        if (!project) return
        set({ project: { ...project, screens, updatedAt: new Date().toISOString() } })
      },

      updateProject: (partial) => {
        const project = get().project
        if (!project) return
        set({ project: { ...project, ...partial, updatedAt: new Date().toISOString() } })
      },

      // ── Phase actions ────────────────────────────────────────────────────

      setPhase: (phase) => set({ phase }),

      advancePhase: () => {
        const { phase } = get()
        const next = nextPhase(phase)
        set({ phase: next })
        get().pushSnapshot(`Advanced to ${next} phase`)
      },

      // ── Breadboard voting ────────────────────────────────────────────────

      setBreadboardVariants: (variants) => set({
        breadboardVariants: variants,
        variantVotes: {},
        selectedVariantId: variants[0]?.id ?? null,
      }),

      voteBreadboardVariant: (variantId, vote) => set((s) => ({
        variantVotes: { ...s.variantVotes, [variantId]: vote },
      })),

      selectBreadboardVariant: (variantId) => set({ selectedVariantId: variantId }),

      commitBreadboard: (variant) => {
        const { project } = get()
        if (!project) return
        // Create a screen from the committed breadboard
        const screen: Screen = {
          id: createId(),
          name: project.name,
          jtbdAttachment: project.jtbd?.raw ?? '',
          businessGoal: project.businessObjectives[0] ?? '',
          breadboard: variant,
          fatMarker: null,
          hifi: null,
          currentFidelity: 'breadboard',
        }
        set({
          project: { ...project, screens: [screen], updatedAt: new Date().toISOString() },
        })
        get().pushSnapshot('Committed breadboard flow')
        get().advancePhase()
      },

      nextBreadboardRound: (newVariants) => set((s) => ({
        breadboardVariants: newVariants,
        breadboardRound: s.breadboardRound + 1,
        variantVotes: {},
        selectedVariantId: newVariants[0]?.id ?? null,
      })),

      // ── Fat marker voting ────────────────────────────────────────────────

      setFatMarkerVariants: (variants) => set({
        fatMarkerVariants: variants,
        fatMarkerVotes: {},
        selectedFatMarkerId: variants[0]?.id ?? null,
      }),

      voteFatMarkerVariant: (variantId, vote) => set((s) => ({
        fatMarkerVotes: { ...s.fatMarkerVotes, [variantId]: vote },
      })),

      selectFatMarkerVariant: (variantId) => set({ selectedFatMarkerId: variantId }),

      commitFatMarker: (variant) => {
        const { project } = get()
        if (!project || project.screens.length === 0) return
        const screens = [...project.screens]
        screens[0] = { ...screens[0], fatMarker: variant, currentFidelity: 'fatMarker' }
        set({
          project: { ...project, screens, updatedAt: new Date().toISOString() },
        })
        get().pushSnapshot('Committed fat marker layout')
        get().advancePhase()
      },

      // ── Hi-fi voting ────────────────────────────────────────────────────

      setHifiVariants: (variants) => set({
        hifiVariants: variants,
        hifiVotes: {},
        selectedHifiId: variants[0]?.id ?? null,
      }),

      voteHifiVariant: (variantId, vote) => set((s) => ({
        hifiVotes: { ...s.hifiVotes, [variantId]: vote },
      })),

      selectHifiVariant: (variantId) => set({ selectedHifiId: variantId }),

      commitHifi: (variant) => {
        const { project } = get()
        if (!project || project.screens.length === 0) return
        const screens = [...project.screens]
        screens[0] = { ...screens[0], hifi: variant, currentFidelity: 'hifi' }
        set({
          project: { ...project, screens, updatedAt: new Date().toISOString() },
        })
        get().pushSnapshot('Committed hi-fi design')
        get().advancePhase()
      },

      // ── Chat actions ─────────────────────────────────────────────────────

      addMessage: (msg) => set((s) => ({
        messages: [...s.messages, {
          ...msg,
          id: createId(),
          timestamp: new Date().toISOString(),
        }],
      })),

      setGenerating: (v) => set({ isGenerating: v }),

      // ── History actions ──────────────────────────────────────────────────

      pushSnapshot: (label) => {
        const { project, phase, snapshots } = get()
        if (!project) return
        set({
          snapshots: [...snapshots, {
            id: createId(),
            timestamp: new Date().toISOString(),
            phase,
            label,
            projectState: JSON.stringify(project),
          }],
        })
      },

      // ── Reset ────────────────────────────────────────────────────────────

      resetProject: () => set({
        project: null,
        phase: 'setup',
        messages: [],
        breadboardVariants: [],
        breadboardRound: 1,
        variantVotes: {},
        selectedVariantId: null,
        fatMarkerVariants: [],
        fatMarkerRound: 1,
        fatMarkerVotes: {},
        selectedFatMarkerId: null,
        hifiVariants: [],
        hifiRound: 1,
        hifiVotes: {},
        selectedHifiId: null,
        snapshots: [],
        isGenerating: false,
      }),
    }),
)
