import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, ArrowUp } from 'lucide-react'
import content from '../../config/content.json'

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-chatbot', handleOpen)
    return () => window.removeEventListener('open-chatbot', handleOpen)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    const userMessage = { id: Date.now(), role: 'user', text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'ai', text: content.chatbot.mockReply }
      ])
    }, 800)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6">
      <div className="flex h-full w-full translate-y-0 flex-col border border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950 sm:h-[580px] sm:w-[400px] sm:rounded-xl sm:shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {content.chatbot.title}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {content.chatbot.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                <Sparkles size={20} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {content.chatbot.emptyState}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={content.chatbot.placeholder}
            className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            disabled={!input.trim()}
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
