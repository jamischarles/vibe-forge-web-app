'use client'

import { JTBDStatement } from '@/lib/vf-types'

interface JTBDPanelProps {
  jtbd: JTBDStatement | null
  onUpdate?: (jtbd: JTBDStatement) => void
}

export default function JTBDPanel({ jtbd, onUpdate }: JTBDPanelProps) {
  if (!jtbd) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Jobs to Be Done
        </h3>
        <p className="text-sm text-gray-600 italic">
          Describe your product idea to generate a JTBD statement
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Jobs to Be Done
      </h3>
      <div className="space-y-2">
        <div>
          <span className="text-[10px] text-gray-600 uppercase">When I</span>
          <p className="text-sm text-gray-300">{jtbd.situation}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-600 uppercase">I want to</span>
          <p className="text-sm text-gray-300">{jtbd.motivation}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-600 uppercase">So I can</span>
          <p className="text-sm text-gray-300">{jtbd.outcome}</p>
        </div>
      </div>
    </div>
  )
}
