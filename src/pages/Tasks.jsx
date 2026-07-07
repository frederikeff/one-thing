import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../db.js'
import { todayKey, startOfTodayISO, fmtMinutes } from '../lib/dates.js'
import { PRAISE, pick } from '../lib/words.js'

export default function Tasks({ goFocus }) {
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], undefined)
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])
  const [title, setTitle] = useState('')
  const [toast, setToast] = useState(null)
  const [armDelete, setArmDelete] = useState(null)
  const disarmTimer = useRef(null)

  useEffect(() => () => clearTimeout(disarmTimer.current), [])

  const secondsByTask = {}
  for (const s of sessions) {
    secondsByTask[s.taskId] = (secondsByTask[s.taskId] ?? 0) + s.seconds
  }

  async function addTask() {
    const t = title.trim()
    if (!t) return
    await db.tasks.add({
      id: newId(),
      title: t,
      createdAt: new Date().toISOString(),
      doneAt: null,
      todayKey: null,
      proud: 0,
    })
    setTitle('')
  }

  async function toggleToday(task) {
    await db.tasks.update(task.id, {
      todayKey: task.todayKey === todayKey() ? null : todayKey(),
    })
  }

  async function completeTask(task) {
    await db.tasks.update(task.id, { doneAt: new Date().toISOString() })
    setToast(`🎉 ${pick(PRAISE)}`)
    setTimeout(() => setToast(null), 3000)
  }

  function tapDelete(task) {
    if (armDelete === task.id) {
      db.tasks.delete(task.id)
      setArmDelete(null)
    } else {
      setArmDelete(task.id)
      clearTimeout(disarmTimer.current)
      disarmTimer.current = setTimeout(() => setArmDelete(null), 2500)
    }
  }

  if (tasks === undefined) return null

  const open = tasks.filter(t => !t.doneAt)
  const today = open.filter(t => t.todayKey === todayKey())
  const later = open
    .filter(t => t.todayKey !== todayKey())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const doneToday = tasks
    .filter(t => t.doneAt && t.doneAt >= startOfTodayISO())
    .sort((a, b) => b.doneAt.localeCompare(a.doneAt))

  const row = (task, isToday) => (
    <div className="task-row" key={task.id}>
      <button
        className={isToday ? 'sun on' : 'sun'}
        title={isToday ? 'Move back to the pile' : 'Do it today'}
        onClick={() => toggleToday(task)}
      >
        {isToday ? '☀️' : '○'}
      </button>
      <div className="task-main">
        <span className="task-title">{task.title}</span>
        {secondsByTask[task.id] >= 60 && (
          <span className="badge">🔥 {fmtMinutes(secondsByTask[task.id])} in</span>
        )}
      </div>
      <button className="row-btn go" title="Focus on this now" onClick={() => goFocus(task.id)}>▶</button>
      <button className="row-btn check" title="Done!" onClick={() => completeTask(task)}>✓</button>
      <button
        className={armDelete === task.id ? 'row-btn del sure' : 'row-btn del'}
        title="Let it go"
        onClick={() => tapDelete(task)}
      >
        {armDelete === task.id ? 'sure?' : '×'}
      </button>
    </div>
  )

  return (
    <div>
      <h1>The pile</h1>
      <p className="lede">Empty your head. One thing per line, hit enter, done. Nothing here expires.</p>

      <div className="card">
        <input
          placeholder="What’s buzzing in your head?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
      </div>

      {toast && <div className="card proud"><p className="snippet-text">{toast}</p></div>}

      <section>
        <h2>☀️ Today ({today.length})</h2>
        {today.length === 0 && (
          <p className="sub">Nothing picked for today yet. Tap a ○ below to pull something in — one or two is plenty.</p>
        )}
        {today.map(t => row(t, true))}
      </section>

      <section>
        <h2>🧺 Later ({later.length})</h2>
        {later.length === 0 && <p className="sub">The pile is empty. Head empty too? Enjoy it. 🌸</p>}
        {later.map(t => row(t, false))}
      </section>

      {doneToday.length > 0 && (
        <section>
          <h2>✅ Done today ({doneToday.length})</h2>
          {doneToday.map(t => (
            <div className="task-row done" key={t.id}>
              <span className="task-title struck">{t.title}</span>
              <span className="badge">🎉</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
