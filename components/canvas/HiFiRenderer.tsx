'use client'

import { useRef, useEffect } from 'react'
import { HiFiData } from '@/lib/vf-types'

interface HiFiRendererProps {
  data: HiFiData | null
  className?: string
}

export default function HiFiRenderer({ data, className }: HiFiRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!data || !iframeRef.current) return

    const html = data.css
      ? `${data.html}<style>${data.css}</style>`
      : data.html

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    iframeRef.current.src = url

    return () => URL.revokeObjectURL(url)
  }, [data])

  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className ?? ''}`}>
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-50">✦</div>
          <p className="text-sm">No hi-fi render to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full ${className ?? ''}`}>
      <iframe
        ref={iframeRef}
        title="Hi-Fi Preview"
        className="w-full h-full border-0 rounded-lg bg-white"
        sandbox="allow-scripts"
      />
    </div>
  )
}
