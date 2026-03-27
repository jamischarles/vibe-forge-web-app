/**
 * Client-side auto-layout for breadboard graphs.
 *
 * The AI returns only logical graph data (places, affordances, connections).
 * This module computes x/y/width/height positions deterministically,
 * saving ~40% of output tokens and producing more consistent layouts.
 */

import type { Place, Connection } from './vf-types'

interface PlaceInput {
  id: string
  label: string
}

interface LayoutResult {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

const VIEWPORT_W = 800
const VIEWPORT_H = 600
const PAD = 40
const NODE_H = 80
const NODE_MIN_W = 120
const NODE_MAX_W = 180
const GAP_X = 40
const GAP_Y = 40

/**
 * Estimate node width based on label length.
 */
function nodeWidth(label: string): number {
  const charW = 8 // approx monospace char width
  const w = Math.max(NODE_MIN_W, Math.min(NODE_MAX_W, label.length * charW + 32))
  return w
}

/**
 * Build an adjacency list from connections to determine graph layers (BFS).
 */
function buildLayers(places: PlaceInput[], connections: { fromPlaceId: string; toPlaceId: string }[]): string[][] {
  const adj = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const p of places) {
    adj.set(p.id, [])
    inDegree.set(p.id, 0)
  }

  for (const c of connections) {
    adj.get(c.fromPlaceId)?.push(c.toPlaceId)
    inDegree.set(c.toPlaceId, (inDegree.get(c.toPlaceId) ?? 0) + 1)
  }

  // Find roots (zero in-degree)
  const roots = places.filter((p) => (inDegree.get(p.id) ?? 0) === 0).map((p) => p.id)
  if (roots.length === 0 && places.length > 0) {
    roots.push(places[0].id) // fallback: use first node
  }

  const layers: string[][] = []
  const visited = new Set<string>()
  let queue = [...roots]

  while (queue.length > 0) {
    const layer: string[] = []
    const next: string[] = []

    for (const id of queue) {
      if (visited.has(id)) continue
      visited.add(id)
      layer.push(id)

      for (const neighbor of adj.get(id) ?? []) {
        if (!visited.has(neighbor)) {
          next.push(neighbor)
        }
      }
    }

    if (layer.length > 0) layers.push(layer)
    queue = next
  }

  // Add any unvisited nodes (disconnected) to last layer
  const remaining = places.filter((p) => !visited.has(p.id)).map((p) => p.id)
  if (remaining.length > 0) {
    layers.push(remaining)
  }

  return layers
}

/**
 * Auto-layout places in a left-to-right layered graph.
 * Uses topological BFS to determine columns, then centers rows vertically.
 */
export function computeLayout(
  places: PlaceInput[],
  connections: { fromPlaceId: string; toPlaceId: string }[]
): LayoutResult[] {
  if (places.length === 0) return []

  // Single node — center it
  if (places.length === 1) {
    const p = places[0]
    const w = nodeWidth(p.label)
    return [{
      id: p.id,
      label: p.label,
      x: (VIEWPORT_W - w) / 2,
      y: (VIEWPORT_H - NODE_H) / 2,
      width: w,
      height: NODE_H,
    }]
  }

  const layers = buildLayers(places, connections)
  const placeMap = new Map(places.map((p) => [p.id, p]))

  // Compute widths for each node
  const widths = new Map<string, number>()
  for (const p of places) {
    widths.set(p.id, nodeWidth(p.label))
  }

  // Calculate total width needed for columns
  const colWidths = layers.map((layer) =>
    Math.max(...layer.map((id) => widths.get(id) ?? NODE_MIN_W))
  )
  const totalW = colWidths.reduce((s, w) => s + w, 0) + GAP_X * (layers.length - 1)

  // Starting X to center the layout
  const startX = Math.max(PAD, (VIEWPORT_W - totalW) / 2)

  const results: LayoutResult[] = []
  let curX = startX

  for (let col = 0; col < layers.length; col++) {
    const layer = layers[col]
    const colW = colWidths[col]

    // Calculate total height for this column
    const totalH = layer.length * NODE_H + (layer.length - 1) * GAP_Y
    const startY = Math.max(PAD, (VIEWPORT_H - totalH) / 2)

    for (let row = 0; row < layer.length; row++) {
      const id = layer[row]
      const p = placeMap.get(id)!
      const w = widths.get(id) ?? NODE_MIN_W

      results.push({
        id: p.id,
        label: p.label,
        x: curX + (colW - w) / 2, // center within column
        y: startY + row * (NODE_H + GAP_Y),
        width: w,
        height: NODE_H,
      })
    }

    curX += colW + GAP_X
  }

  return results
}
