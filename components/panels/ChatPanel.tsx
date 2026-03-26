'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { ChatMessage } from '@/lib/vf-types'

interface ChatPanelProps {
  messages: ChatMessage[]
  isGenerating: boolean
  placeholder?: string
  onSend: (message: string) => void
}

export default function ChatPanel({ messages, isGenerating, placeholder, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Describe your product or feature idea</p>
            <p className="text-xs text-gray-600 mt-1">VibeForge will extract a JTBD statement and generate flow variants</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl px-3 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600/20 text-blue-100 ml-4'
                : msg.role === 'system'
                  ? 'bg-gray-700/50 text-gray-400 text-xs'
                  : 'bg-gray-800/50 text-gray-300 mr-4'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>

            {/* Changes summary */}
            {msg.metadata?.changesSummary && msg.metadata.changesSummary.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                  What changed
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {msg.metadata.changesSummary.map((change, i) => (
                    <li key={i} className="text-xs text-gray-500">• {change}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="bg-gray-800/50 rounded-xl px-3 py-2.5 mr-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-700/50 pt-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Describe your idea...'}
            disabled={isGenerating}
            rows={1}
            className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-600 text-white transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
