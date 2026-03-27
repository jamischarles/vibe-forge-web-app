'use client'

import { useRef, useState, useCallback, type ReactNode, type MouseEvent } from 'react'

interface PannableCanvasProps {
  children: ReactNode
  className?: string
}

export default function PannableCanvas({ children, className }: PannableCanvasProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    }
  }, [pan])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPan({
      x: dragRef.current.startPanX + dx,
      y: dragRef.current.startPanY + dy,
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  const handleDoubleClick = useCallback(() => {
    setPan({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${className ?? ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}
