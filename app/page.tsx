'use client'

import { useCallback, useState } from 'react'
import { RotateCcw, Download } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { BreadboardData, FatMarkerData, HiFiData, FidelityLevel } from '@/lib/vf-types'

import PhaseIndicator from '@/components/panels/PhaseIndicator'
import ChatPanel from '@/components/panels/ChatPanel'
import JTBDPanel from '@/components/panels/JTBDPanel'
import VotingPanel from '@/components/panels/VotingPanel'
import BreadboardRenderer from '@/components/canvas/BreadboardRenderer'
import FatMarkerRenderer from '@/components/canvas/FatMarkerRenderer'
import HiFiRenderer from '@/components/canvas/HiFiRenderer'

// ── API helper ───────────────────────────────────────────────────────────────

async function callDesignAPI(body: Record<string, unknown>) {
  const res = await fetch('/api/generate-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const {
    project, phase, messages, isGenerating,
    // Breadboard
    breadboardVariants, breadboardRound, variantVotes, selectedVariantId,
    // Fat marker
    fatMarkerVariants, fatMarkerRound, fatMarkerVotes, selectedFatMarkerId,
    // Hi-fi
    hifiVariants, hifiRound, hifiVotes, selectedHifiId,
    // Actions
    initProject, setJTBD, updateProject, setPhase,
    setBreadboardVariants, voteBreadboardVariant, selectBreadboardVariant,
    commitBreadboard, nextBreadboardRound,
    setFatMarkerVariants, voteFatMarkerVariant, selectFatMarkerVariant, commitFatMarker,
    setHifiVariants, voteHifiVariant, selectHifiVariant, commitHifi,
    addMessage, setGenerating, resetProject,
  } = useStore()

  // ── Setup phase: extract JTBD and generate breadboards ───────────────────

  const handleSetupMessage = useCallback(async (text: string) => {
    // Initialize project if needed
    if (!project) {
      const name = text.length > 40 ? text.slice(0, 40) + '...' : text
      initProject(name, text)
    }

    addMessage({ role: 'user', content: text })
    setGenerating(true)

    try {
      // Step 1: Extract JTBD
      const setupResult = await callDesignAPI({
        phase: 'setup',
        action: 'setup',
        prompt: text,
      })

      setJTBD(setupResult.jtbd)
      updateProject({
        businessObjectives: setupResult.suggestedScreens.map((s: { description: string }) => s.description),
      })

      addMessage({
        role: 'assistant',
        content: `I've analyzed your idea and extracted a JTBD statement:\n\n"${setupResult.jtbd.raw}"\n\nI identified ${setupResult.suggestedScreens.length} key screens and ${setupResult.suggestedFlows.length} user flows. Generating breadboard variants now...`,
        metadata: {
          phase: 'setup',
          changesSummary: [
            `JTBD: ${setupResult.jtbd.raw}`,
            ...setupResult.suggestedScreens.map((s: { name: string }) => `Screen: ${s.name}`),
          ],
        },
      })

      // Step 2: Generate breadboard variants
      const bbResult = await callDesignAPI({
        phase: 'breadboard',
        action: 'generate_breadboards',
        prompt: text,
        projectContext: {
          jtbd: setupResult.jtbd,
          screens: setupResult.suggestedScreens,
          flows: setupResult.suggestedFlows,
        },
      })

      setBreadboardVariants(bbResult.variants)
      setPhase('breadboard')

      addMessage({
        role: 'assistant',
        content: `Generated ${bbResult.variants.length} breadboard variants. Review and vote on each one — upvote what you like, downvote what doesn't work, and star your favorite.`,
        metadata: { phase: 'breadboard' },
      })
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      })
    } finally {
      setGenerating(false)
    }
  }, [project, initProject, addMessage, setGenerating, setJTBD, updateProject, setBreadboardVariants, setPhase])

  // ── Breadboard phase: handle next round ──────────────────────────────────

  const handleBreadboardNextRound = useCallback(async () => {
    setGenerating(true)
    addMessage({ role: 'system', content: `Starting voting round ${breadboardRound + 1}...` })

    try {
      const result = await callDesignAPI({
        phase: 'breadboard',
        action: 'remix_breadboards',
        prompt: project?.description ?? '',
        projectContext: {
          jtbd: project?.jtbd ?? undefined,
          screens: project?.businessObjectives.map((d, i) => ({
            name: `Screen ${i + 1}`,
            description: d,
          })),
          previousVariants: breadboardVariants,
          votes: variantVotes,
        },
      })

      nextBreadboardRound(result.variants)

      addMessage({
        role: 'assistant',
        content: `Generated ${result.variants.length} remixed variants based on your votes. Vote again!`,
        metadata: { phase: 'breadboard' },
      })
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `Error generating remixes: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      })
    } finally {
      setGenerating(false)
    }
  }, [project, breadboardVariants, variantVotes, breadboardRound, addMessage, setGenerating, nextBreadboardRound])

  // ── Fat marker phase: generate after breadboard commit ───────────────────

  const handleCommitBreadboard = useCallback(async (variant: BreadboardData) => {
    commitBreadboard(variant)
    addMessage({
      role: 'system',
      content: `Committed breadboard: "${variant.name}". Generating fat marker layouts...`,
    })
    setGenerating(true)

    try {
      const result = await callDesignAPI({
        phase: 'fatMarker',
        action: 'generate_fat_markers',
        prompt: project?.description ?? '',
        projectContext: {
          jtbd: project?.jtbd ?? undefined,
          breadboard: variant,
        },
      })

      setFatMarkerVariants(result.variants)

      addMessage({
        role: 'assistant',
        content: `Generated ${result.variants.length} layout variants. These show rough spatial arrangement — vote on the layout that feels right.`,
        metadata: { phase: 'fatMarker' },
      })
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `Error generating layouts: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      })
    } finally {
      setGenerating(false)
    }
  }, [project, commitBreadboard, addMessage, setGenerating, setFatMarkerVariants])

  // ── Hi-fi phase: generate after fat marker commit ────────────────────────

  const handleCommitFatMarker = useCallback(async (variant: FatMarkerData) => {
    commitFatMarker(variant)
    addMessage({
      role: 'system',
      content: `Committed layout: "${variant.name}". Generating hi-fi renders...`,
    })
    setGenerating(true)

    try {
      const screen = project?.screens[0]
      const result = await callDesignAPI({
        phase: 'hifi',
        action: 'generate_hifi',
        prompt: project?.description ?? '',
        projectContext: {
          jtbd: project?.jtbd ?? undefined,
          breadboard: screen?.breadboard ?? undefined,
          fatMarker: variant,
        },
      })

      setHifiVariants(result.variants)

      addMessage({
        role: 'assistant',
        content: `Generated ${result.variants.length} hi-fi design variants. Pick the one that best matches your vision.`,
        metadata: { phase: 'hifi' },
      })
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `Error generating hi-fi: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      })
    } finally {
      setGenerating(false)
    }
  }, [project, commitFatMarker, addMessage, setGenerating, setHifiVariants])

  // ── Commit hi-fi ─────────────────────────────────────────────────────────

  const handleCommitHifi = useCallback((variant: HiFiData) => {
    commitHifi(variant)
    addMessage({
      role: 'system',
      content: `Committed hi-fi design: "${variant.name}". Your design is complete!`,
    })
  }, [commitHifi, addMessage])

  // ── Chat handler (routes by phase) ───────────────────────────────────────

  const handleChatSend = useCallback((text: string) => {
    if (phase === 'setup' || !project) {
      handleSetupMessage(text)
    } else {
      // For non-setup phases, just add as a chat message (feedback for next round)
      addMessage({ role: 'user', content: text })
    }
  }, [phase, project, handleSetupMessage, addMessage])

  // ── X-ray toggle ────────────────────────────────────────────────────────

  const [xrayLevel, setXrayLevel] = useState<FidelityLevel>('breadboard')

  // ── Export handler ─────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (!project) return
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-vibeforge.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [project])

  // ── Canvas content ───────────────────────────────────────────────────────

  const selectedBreadboard = breadboardVariants.find((v) => v.id === selectedVariantId) ?? null
  const selectedFatMarker = fatMarkerVariants.find((v) => v.id === selectedFatMarkerId) ?? null
  const selectedHifi = hifiVariants.find((v) => v.id === selectedHifiId) ?? null

  const committedScreen = project?.screens[0] ?? null

  function renderCanvas() {
    // In export phase, use X-ray toggle to switch fidelity views
    if (phase === 'export' && committedScreen) {
      switch (xrayLevel) {
        case 'breadboard':
          return <BreadboardRenderer data={committedScreen.breadboard} />
        case 'fatMarker':
          return <FatMarkerRenderer data={committedScreen.fatMarker} />
        case 'hifi':
          return <HiFiRenderer data={committedScreen.hifi} />
      }
    }

    switch (phase) {
      case 'breadboard':
        return <BreadboardRenderer data={selectedBreadboard} />
      case 'fatMarker':
        return <FatMarkerRenderer data={selectedFatMarker} />
      case 'hifi':
        return <HiFiRenderer data={selectedHifi} />
      default:
        return <BreadboardRenderer data={null} />
    }
  }

  // ── Voting panel for current phase ───────────────────────────────────────

  function renderVotingPanel() {
    switch (phase) {
      case 'breadboard':
        return (
          <VotingPanel
            variants={breadboardVariants}
            votes={variantVotes}
            selectedId={selectedVariantId}
            round={breadboardRound}
            maxRounds={3}
            phaseName="Breadboard"
            isGenerating={isGenerating}
            onVote={voteBreadboardVariant}
            onSelect={selectBreadboardVariant}
            onNextRound={handleBreadboardNextRound}
            onCommit={(v) => handleCommitBreadboard(v as BreadboardData)}
          />
        )
      case 'fatMarker':
        return (
          <VotingPanel
            variants={fatMarkerVariants}
            votes={fatMarkerVotes}
            selectedId={selectedFatMarkerId}
            round={fatMarkerRound}
            maxRounds={2}
            phaseName="Layout"
            isGenerating={isGenerating}
            onVote={voteFatMarkerVariant}
            onSelect={selectFatMarkerVariant}
            onNextRound={() => {}}
            onCommit={(v) => handleCommitFatMarker(v as FatMarkerData)}
          />
        )
      case 'hifi':
        return (
          <VotingPanel
            variants={hifiVariants}
            votes={hifiVotes}
            selectedId={selectedHifiId}
            round={hifiRound}
            maxRounds={1}
            phaseName="Hi-Fi"
            isGenerating={isGenerating}
            onVote={voteHifiVariant}
            onSelect={selectHifiVariant}
            onNextRound={() => {}}
            onCommit={(v) => handleCommitHifi(v as HiFiData)}
          />
        )
      default:
        return null
    }
  }

  // ── Chat placeholder by phase ────────────────────────────────────────────

  const chatPlaceholder = !project
    ? 'Describe your product or feature idea...'
    : phase === 'setup'
      ? 'Refine your description...'
      : phase === 'breadboard'
        ? 'Give feedback on the variants (e.g., "combine the flows from variant 1 and 3")...'
        : phase === 'fatMarker'
          ? 'Describe the mood or style you want...'
          : 'Refine the design...'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">Vibe</span>Forge
          </h1>
          {project && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {project.name}
            </span>
          )}
        </div>

        <PhaseIndicator currentPhase={phase} />

        <div className="flex items-center gap-2">
          {/* X-ray toggle (visible in export phase or when screen has multiple fidelity levels) */}
          {committedScreen && phase === 'export' && (
            <div className="flex items-center bg-gray-800 rounded-lg p-0.5 text-[11px]">
              {(['breadboard', 'fatMarker', 'hifi'] as FidelityLevel[]).map((level) => {
                const hasData = level === 'breadboard'
                  ? !!committedScreen.breadboard
                  : level === 'fatMarker'
                    ? !!committedScreen.fatMarker
                    : !!committedScreen.hifi
                return (
                  <button
                    key={level}
                    onClick={() => setXrayLevel(level)}
                    disabled={!hasData}
                    className={`px-2 py-1 rounded transition-colors ${
                      xrayLevel === level
                        ? 'bg-blue-600 text-white'
                        : hasData
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {level === 'breadboard' ? '⬡' : level === 'fatMarker' ? '▧' : '✦'}
                  </button>
                )
              })}
            </div>
          )}

          {project && (
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors"
              title="Export project"
            >
              <Download size={16} />
            </button>
          )}
          {project && (
            <button
              onClick={resetProject}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors"
              title="New project"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <span className="text-[10px] text-gray-700">v0.1.0</span>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left panel ──────────────────────────────────────────────── */}
        <div className="w-[380px] flex-shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
          {/* JTBD panel */}
          <div className="flex-shrink-0 p-3 border-b border-gray-800/50">
            <JTBDPanel jtbd={project?.jtbd ?? null} />
          </div>

          {/* Voting panel (shown during voting phases) */}
          {(phase === 'breadboard' || phase === 'fatMarker' || phase === 'hifi') && (
            <div className="flex-shrink-0 p-3 border-b border-gray-800/50 max-h-[50%] overflow-y-auto">
              {renderVotingPanel()}
            </div>
          )}

          {/* Chat (fills remaining space) */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col min-h-0">
            <ChatPanel
              messages={messages}
              isGenerating={isGenerating}
              placeholder={chatPlaceholder}
              onSend={handleChatSend}
            />
          </div>
        </div>

        {/* ── Canvas area ─────────────────────────────────────────────── */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="w-full h-full rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
            {renderCanvas()}
          </div>
        </div>
      </div>
    </main>
  )
}
