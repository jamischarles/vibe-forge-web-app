'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Gamepad2, Sparkles, Send } from 'lucide-react'

interface GameConfig {
  heroEmoji: string
  enemyEmoji: string
  backgroundColor: string
  groundColor: string
  title: string
  speed: number
  jumpForce: number
}

type AppState = 'idle' | 'listening' | 'thinking' | 'playing'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [state, setState] = useState<AppState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [transcript, setTranscript] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Check for Web Speech API support
  useEffect(() => {
    const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setVoiceSupported(hasSpeech)
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendConfigToGame = useCallback((config: GameConfig) => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'LOAD_CONFIG', config }, '*')
    }
  }, [])

  const handleGenerate = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setError(null)
    setState('thinking')
    setPrompt('')

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      const config: GameConfig = data.config

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `I made "${config.title}" for you! ${config.heroEmoji} dodges ${config.enemyEmoji}. Press SPACE or tap to jump!`,
      }
      setMessages(prev => [...prev, assistantMessage])

      sendConfigToGame(config)
      setState('playing')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to make the game'
      setError(msg)
      setState('idle')
    }
  }, [sendConfigToGame])

  const handleSubmit = () => {
    if (prompt.trim() && state !== 'thinking') {
      handleGenerate(prompt)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const startListening = () => {
    if (!voiceSupported) return

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setState('listening')
      setTranscript('')
    }

    recognition.onresult = (e: any) => {
      const result = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(result)
      setPrompt(result)
    }

    recognition.onend = () => {
      if (state === 'listening') setState('idle')
      const currentTranscript = recognitionRef.current?.lastTranscript
      if (currentTranscript?.trim()) {
        handleGenerate(currentTranscript)
      }
    }

    recognition.onerror = () => {
      setState('idle')
    }

    recognitionRef.current = recognition
    recognitionRef.current.lastTranscript = ''

    // Track transcript for onend
    recognition.onresult = (e: any) => {
      const result = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(result)
      setPrompt(result)
      recognitionRef.current.lastTranscript = result
    }

    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Left Rail */}
      <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎮</div>
            <div>
              <h1 className="text-xl font-bold text-white">Game Maker</h1>
              <p className="text-xs text-gray-400">Describe your game and play it!</p>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-8 px-4">
              <div className="text-4xl mb-3">✨</div>
              <p>Tell me about your game!</p>
              <p className="text-xs mt-2 text-gray-600">Try: "a dog jumping over cats" or "a rocket dodging asteroids"</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-700 text-gray-100 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {state === 'thinking' && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🎮</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>✨</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🎮</span>
                </span>
                <span className="ml-2 text-gray-400">Building your game...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          {state === 'listening' && transcript && (
            <div className="text-xs text-green-400 bg-green-900/30 rounded-lg px-3 py-2">
              🎤 "{transcript}"
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your game..."
              disabled={state === 'thinking' || state === 'listening'}
              className="flex-1 bg-gray-700 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm resize-none border border-gray-600 focus:outline-none focus:border-green-500 transition-colors min-h-[60px]"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            {voiceSupported && (
              <button
                onClick={state === 'listening' ? stopListening : startListening}
                disabled={state === 'thinking'}
                className={`flex-none w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${
                  state === 'listening'
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={state === 'listening' ? 'Stop recording' : 'Speak your game idea'}
              >
                {state === 'listening' ? <MicOff size={20} className="text-white" /> : <Mic size={20} />}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || state === 'thinking' || state === 'listening'}
              className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                state === 'thinking'
                  ? 'bg-purple-800 text-purple-300 cursor-not-allowed'
                  : prompt.trim()
                  ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/50'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {state === 'thinking' ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  Making...
                </>
              ) : (
                <>
                  <Gamepad2 size={16} />
                  Make My Game!
                </>
              )}
            </button>
          </div>

          {state === 'playing' && (
            <p className="text-xs text-center text-gray-500">
              Describe a new game to change it →
            </p>
          )}
        </div>
      </div>

      {/* Right Rail - Game Preview */}
      <div className="flex-1 relative bg-gray-900">
        <iframe
          ref={iframeRef}
          src="/game.html"
          id="game-frame"
          className="w-full h-full border-0"
          title="Game Preview"
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Status badge */}
        {state === 'playing' && (
          <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-medium">
            🎮 Playing!
          </div>
        )}
      </div>
    </div>
  )
}
