import { useState } from 'react'
import Now from './pages/Now.jsx'
import Tasks from './pages/Tasks.jsx'
import Wins from './pages/Wins.jsx'
import More from './pages/More.jsx'

const TABS = [
  { key: 'now', label: 'Now', emoji: '🔥' },
  { key: 'tasks', label: 'Tasks', emoji: '🧺' },
  { key: 'wins', label: 'Wins', emoji: '🏆' },
  { key: 'more', label: 'More', emoji: '🌿' },
]

export default function App() {
  const [tab, setTab] = useState('now')
  const [preselectId, setPreselectId] = useState(null)

  function goFocus(taskId) {
    setPreselectId(taskId)
    setTab('now')
  }

  return (
    <div className="app">
      <main className="page">
        {tab === 'now' && (
          <Now preselectId={preselectId} clearPreselect={() => setPreselectId(null)} />
        )}
        {tab === 'tasks' && <Tasks goFocus={goFocus} />}
        {tab === 'wins' && <Wins />}
        {tab === 'more' && <More />}
      </main>
      <nav className="tabbar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-emoji">{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
