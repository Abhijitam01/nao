import { useState, useEffect } from 'react'
import ChatBox from './components/ChatBox'

interface SchemaTable {
  name: string
  columns: { name: string; type: string }[]
  rowCount: number
}

interface SchemaInfo {
  tables: SchemaTable[]
}

export default function App() {
  const [schema, setSchema] = useState<SchemaInfo | null>(null)
  const [projectPath, setProjectPath] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    // Try to load default project path from localStorage
    const saved = localStorage.getItem('analytics-agent-project-path')
    if (saved) {
      setProjectPath(saved)
      setIsConfigured(true)
      fetchSchema(saved)
    }
  }, [])

  const fetchSchema = async (path: string) => {
    try {
      const res = await fetch('/health')
      if (res.ok) {
        // Server is up — try loading schema from the project
        try {
          const schemaRes = await fetch(`/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: '__schema__', projectPath: path }),
          })
          // We don't need the response — schema will be read server-side
        } catch {
          // Ignore — schema will be loaded on first query
        }
      }
    } catch {
      // Server not running — that's okay
    }
  }

  const handleConnect = () => {
    if (!projectPath.trim()) return
    localStorage.setItem('analytics-agent-project-path', projectPath)
    setIsConfigured(true)
    fetchSchema(projectPath)
  }

  if (!isConfigured) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          alignItems: 'center',
        }}>
          <div className="empty-state-icon">📊</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Analytics Agent
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
            Enter the path to your analytics project to get started.
          </p>
          <div className="input-wrapper" style={{ width: '100%' }}>
            <input
              className="input-field"
              type="text"
              placeholder="/path/to/your-project"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
            <button className="send-button" onClick={handleConnect}>→</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📊</div>
          <div>
            <h1>Analytics Agent</h1>
            <span>Natural language SQL</span>
          </div>
        </div>

        <div className="sidebar-section">
          <h2>Project</h2>
          <div className="sidebar-info">
            <code>{projectPath.split('/').pop()}</code>
            <button
              onClick={() => {
                localStorage.removeItem('analytics-agent-project-path')
                setIsConfigured(false)
                setProjectPath('')
              }}
              style={{
                marginLeft: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              change
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <h2>Quick Tips</h2>
          <div className="sidebar-info" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span>💡 Ask in plain English</span>
            <span>📈 Charts render automatically</span>
            <span>🔒 Read-only queries only</span>
          </div>
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          Powered by GPT-4o-mini + SQLite
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <ChatBox projectPath={projectPath} />
      </main>
    </div>
  )
}
