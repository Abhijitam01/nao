import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  data?: {
    sql: string
    chartType: string
    xAxis: string
    yAxis: string
    title: string
    description: string
    results: Record<string, unknown>[]
    rowCount: number
  }
  error?: string
}

interface ChatBoxProps {
  projectPath: string
}

const SUGGESTIONS = [
  'Show me monthly revenue trend',
  'What is the total revenue by region?',
  'Compare revenue vs costs over time',
  'Which product has the highest profit?',
  'Show average revenue per month',
]

export default function ChatBox({ projectPath }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          projectPath,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          error: data.error || 'Something went wrong',
        }
        setMessages(prev => [...prev, errorMessage])
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.title || 'Here are the results:',
          data: {
            sql: data.sql,
            chartType: data.chartType,
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            title: data.title,
            description: data.description || '',
            results: data.results,
            rowCount: data.rowCount,
          },
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        error: 'Could not connect to the server. Make sure it is running on port 3001.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="chat-header">
        <div className="status-dot" />
        <h2>Chat</h2>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>Ask anything about your data</h3>
            <p>
              Type a question in plain English and I'll generate the SQL,
              run it, and visualize the results for you.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-text">
                <div className="loading-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="input-field"
            placeholder="Ask a question about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  )
}
