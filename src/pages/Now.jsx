import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, getSetting, setSetting } from '../db.js'
import { todayKey, fmtClock, fmtMinutes } from '../lib/dates.js'
import { PRAISE, START_NUDGES, BREAK_IDEAS, STOP_NOTES, pick, chime } from '../lib/words.js'
import Confetti from '../components/Confetti.jsx'

const MINUTE_CHOICES = [5, 10, 15, 25, 45]
const BREAK_SECONDS = 3 * 60

function greeting(name) {
  const h = new Date().getHours()
  const part =
    h < 5 ? 'Hello, night owl' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return name ? `${part}, ${name}.` : `${part}.`
}

function elapsedSeconds(focus, nowMs) {
  const running = focus.startedAt ? (nowMs - Date.parse(focus.startedAt)) / 1000 : 0
  return (focus.bankedSeconds ?? 0) + Math.max(0, running)
}

export default function Now({ preselectId, clearPreselect }) {
  const name = useLiveQuery(() => getSetting('name', ''), [], '')
  const soundOn = useLiveQuery(() => getSetting('soundOn', true), [], true)
  const lastMinutes = useLiveQuery(() => getSetting('lastMinutes', 15), [], 15)
  const focus = useLiveQuery(() => getSetting('focus', null), [], undefined)
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], undefined)

  const [selectedId, setSelectedId] = useState(null)
  const [minutes, setMinutes] = useState(null)
  const [celebrate, setCelebrate] = useState(null) // { title, seconds, taskId, praise }
  const [stopNote, setStopNote] = useState(null) // { text, detail }
  const [newTitle, setNewTitle] = useState('')
  const [, setTick] = useState(0)
  const prevRemaining = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (preselectId) {
      setSelectedId(preselectId)
      setCelebrate(null)
      setStopNote(null)
      clearPreselect()
    }
  }, [preselectId, clearPreselect])

  const task = focus && tasks ? tasks.find(t => t.id === focus.taskId) : null

  // If the focused task was deleted from the list, let the session go quietly.
  useEffect(() => {
    if (focus && tasks && !task) setSetting('focus', null)
  }, [focus, tasks, task])

  const nowMs = Date.now()
  const remaining = focus && focus.phase !== 'break' ? focus.plannedMin * 60 - elapsedSeconds(focus, nowMs) : null

  useEffect(() => {
    if (focus?.phase === 'running' && prevRemaining.current > 0 && remaining <= 0) {
      if (soundOn) chime()
    }
    prevRemaining.current = remaining
  }, [remaining, focus?.phase, soundOn])

  useEffect(() => {
    if (focus?.phase === 'running' && task) {
      document.title = remaining > 0 ? `${fmtClock(remaining)} · ${task.title}` : `🔥 bonus · ${task.title}`
    } else {
      document.title = 'One Thing'
    }
    return () => {
      document.title = 'One Thing'
    }
  }, [focus?.phase, remaining, task])

  async function startFocus(taskId, min) {
    const now = new Date().toISOString()
    setStopNote(null)
    setCelebrate(null)
    setSelectedId(null)
    setMinutes(null)
    await setSetting('lastMinutes', min)
    await setSetting('focus', {
      taskId,
      plannedMin: min,
      phase: 'running',
      startedAt: now,
      firstStartedAt: now,
      bankedSeconds: 0,
      breakStartedAt: null,
    })
  }

  async function recordStretch(outcome) {
    const seconds = Math.min(elapsedSeconds(focus, Date.now()), (focus.plannedMin + 90) * 60)
    if (seconds >= 10) {
      await db.sessions.add({
        id: newId(),
        taskId: focus.taskId,
        startedAt: focus.firstStartedAt,
        endedAt: new Date().toISOString(),
        seconds: Math.round(seconds),
        plannedMin: focus.plannedMin,
        outcome,
      })
    }
    return seconds
  }

  async function finishTask() {
    const seconds = await recordStretch('finished')
    await db.tasks.update(focus.taskId, { doneAt: new Date().toISOString() })
    await setSetting('focus', null)
    setCelebrate({ taskId: focus.taskId, title: task.title, seconds, praise: pick(PRAISE) })
  }

  async function stopForNow() {
    const seconds = await recordStretch('stopped')
    await setSetting('focus', null)
    setStopNote({
      text: pick(STOP_NOTES),
      detail: seconds >= 10 ? `${fmtMinutes(seconds)} on “${task.title}” — saved.` : null,
    })
  }

  async function takeBreak() {
    await recordStretch('break')
    await setSetting('focus', {
      ...focus,
      phase: 'break',
      startedAt: null,
      firstStartedAt: null,
      bankedSeconds: 0,
      breakStartedAt: new Date().toISOString(),
    })
  }

  async function backToIt() {
    const now = new Date().toISOString()
    await setSetting('focus', {
      ...focus,
      phase: 'running',
      startedAt: now,
      firstStartedAt: now,
      bankedSeconds: 0,
      breakStartedAt: null,
    })
  }

  async function pauseFocus() {
    await setSetting('focus', {
      ...focus,
      phase: 'paused',
      bankedSeconds: elapsedSeconds(focus, Date.now()),
      startedAt: null,
    })
  }

  async function resumeFocus() {
    await setSetting('focus', { ...focus, phase: 'running', startedAt: new Date().toISOString() })
  }

  async function keepGoing(extraMin) {
    await setSetting('focus', { ...focus, plannedMin: focus.plannedMin + extraMin })
  }

  async function addAndSelect() {
    const title = newTitle.trim()
    if (!title) return
    const id = newId()
    await db.tasks.add({
      id,
      title,
      createdAt: new Date().toISOString(),
      doneAt: null,
      todayKey: todayKey(),
      proud: 0,
    })
    setNewTitle('')
    setSelectedId(id)
  }

  async function markProud(level) {
    await db.tasks.update(celebrate.taskId, { proud: level })
    setCelebrate({ ...celebrate, proud: level })
  }

  if (focus === undefined || tasks === undefined) return null

  // ---- celebrate ----
  if (celebrate) {
    return (
      <div className="focus-screen celebrate">
        <Confetti />
        <p className="focus-label">DONE 🎉</p>
        <h1 className="focus-task">{celebrate.title}</h1>
        {celebrate.seconds >= 10 && <p className="sub">You focused for {fmtMinutes(celebrate.seconds)}.</p>}
        <p className="praise">{celebrate.praise}</p>
        <div className="proud-row">
          <button
            className={celebrate.proud === 1 ? 'chip on' : 'chip'}
            onClick={() => markProud(celebrate.proud === 1 ? 0 : 1)}
          >
            😊 Proud of this
          </button>
          <button
            className={celebrate.proud === 2 ? 'chip on' : 'chip'}
            onClick={() => markProud(celebrate.proud === 2 ? 0 : 2)}
          >
            🌟 EXTRA proud
          </button>
        </div>
        <button className="primary big" onClick={() => setCelebrate(null)}>
          What’s next? →
        </button>
      </div>
    )
  }

  // ---- break ----
  if (focus?.phase === 'break') {
    const breakElapsed = (nowMs - Date.parse(focus.breakStartedAt)) / 1000
    const breakLeft = BREAK_SECONDS - breakElapsed
    const idea = BREAK_IDEAS[Math.floor(breakElapsed / 20) % BREAK_IDEAS.length]
    return (
      <div className="focus-screen break">
        <p className="focus-label">Break time ☁️</p>
        <div className="big-timer">{breakLeft > 0 ? fmtClock(breakLeft) : 'Ready when you are'}</div>
        <p className="break-idea">{idea}</p>
        <div className="stack">
          <button className="primary big" onClick={backToIt}>
            🔁 Back to it — {focus.plannedMin} more min
          </button>
          <button className="secondary" onClick={() => setSetting('focus', null)}>
            Pick something else
          </button>
          <button className="ghost" onClick={() => setSetting('focus', null)}>
            I’m done for now ☀️
          </button>
        </div>
      </div>
    )
  }

  // ---- running / paused ----
  if (focus && task) {
    const paused = focus.phase === 'paused'
    const overtime = remaining <= 0
    const progress = Math.min(1, elapsedSeconds(focus, nowMs) / (focus.plannedMin * 60))
    return (
      <div className={overtime ? 'focus-screen overtime' : 'focus-screen'}>
        <p className="focus-label">{overtime ? 'Time! You’re in bonus minutes 🔥' : paused ? 'Paused — no rush' : 'One thing. Just this.'}</p>
        <h1 className="focus-task">{task.title}</h1>
        <div className="big-timer">{overtime ? `+${fmtClock(-remaining)}` : fmtClock(remaining)}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {overtime ? (
          <>
            <p className="sub">Hyperfocus is welcome here. When you surface: water, stretch, breathe.</p>
            <div className="stack">
              <button className="primary big" onClick={finishTask}>✅ I finished it!</button>
              <button className="secondary" onClick={takeBreak}>☁️ Take a 3-min break</button>
              <div className="chips-row">
                {[5, 10, 25].map(m => (
                  <button key={m} className="chip" onClick={() => keepGoing(m)}>
                    🔥 +{m} min
                  </button>
                ))}
              </div>
              <button className="ghost" onClick={stopForNow}>🧺 Stop for now</button>
            </div>
          </>
        ) : (
          <div className="stack">
            <button className="primary big" onClick={finishTask}>✅ I finished it!</button>
            {paused ? (
              <button className="secondary" onClick={resumeFocus}>▶ Keep going</button>
            ) : (
              <button className="secondary" onClick={pauseFocus}>⏸ Pause</button>
            )}
            <button className="ghost" onClick={stopForNow}>🧺 Stop for now — minutes still count</button>
          </div>
        )}
      </div>
    )
  }

  // ---- picker ----
  const openToday = tasks.filter(t => !t.doneAt && t.todayKey === todayKey())
  const openLater = tasks
    .filter(t => !t.doneAt && t.todayKey !== todayKey())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const selected = tasks.find(t => t.id === selectedId)

  if (selected) {
    const m = minutes ?? lastMinutes
    return (
      <div className="focus-screen">
        <p className="focus-label">Your one thing</p>
        <h1 className="focus-task">{selected.title}</h1>
        <p className="sub">How long? Small is perfect.</p>
        <div className="chips-row">
          {MINUTE_CHOICES.map(c => (
            <button key={c} className={c === m ? 'chip on' : 'chip'} onClick={() => setMinutes(c)}>
              {c} min
            </button>
          ))}
        </div>
        <div className="stack">
          <button className="primary big" onClick={() => startFocus(selected.id, m)}>
            Let’s go — just {m} minutes
          </button>
          <button className="ghost" onClick={() => setSelectedId(null)}>← different thing</button>
        </div>
        <p className="nudge">{nudgeFor(selected.id)}</p>
      </div>
    )
  }

  return (
    <div>
      <h1>{greeting(name)}</h1>
      <p className="lede">What’s your ONE thing right now?</p>

      {stopNote && (
        <div className="card proud">
          <p className="snippet-text">{stopNote.text}</p>
          {stopNote.detail && <p className="sub">{stopNote.detail}</p>}
          <button className="ghost" onClick={() => setStopNote(null)}>ok 💛</button>
        </div>
      )}

      <div className="card">
        <input
          placeholder="Type a new thing and hit enter…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addAndSelect()}
        />
      </div>

      {openToday.length > 0 && (
        <section>
          <h2>Today’s things</h2>
          {openToday.map(t => (
            <button key={t.id} className="pick-card" onClick={() => setSelectedId(t.id)}>
              <span>☀️ {t.title}</span>
              <span className="pick-go">start →</span>
            </button>
          ))}
        </section>
      )}

      {openLater.length > 0 && (
        <section>
          <h2>From the pile</h2>
          {openLater.slice(0, 5).map(t => (
            <button key={t.id} className="pick-card" onClick={() => setSelectedId(t.id)}>
              <span>{t.title}</span>
              <span className="pick-go">start →</span>
            </button>
          ))}
          {openLater.length > 5 && (
            <p className="sub">…and {openLater.length - 5} more in the Tasks tab. They can wait.</p>
          )}
        </section>
      )}

      {openToday.length === 0 && openLater.length === 0 && (
        <div className="card">
          <p className="snippet-text">Nothing in the pile. Type whatever is buzzing in your head above — one thing at a time. 🧠</p>
        </div>
      )}
    </div>
  )
}

// Stable nudge per selected task so it doesn't flicker on each tick.
const nudgeCache = new Map()
function nudgeFor(taskId) {
  if (!nudgeCache.has(taskId)) nudgeCache.set(taskId, pick(START_NUDGES))
  return nudgeCache.get(taskId)
}
