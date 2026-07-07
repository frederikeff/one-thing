import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db.js'
import { startOfTodayISO, fmtDay, fmtMinutes } from '../lib/dates.js'

export default function Wins() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], undefined)
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])

  if (tasks === undefined) return null

  const done = tasks.filter(t => t.doneAt).sort((a, b) => b.doneAt.localeCompare(a.doneAt))
  const secondsEver = sessions.reduce((sum, s) => sum + s.seconds, 0)
  const proudCount = tasks.filter(t => t.proud >= 1).length
  const extraProud = tasks.filter(t => t.proud === 2).length

  const todayISO = startOfTodayISO()
  const doneToday = done.filter(t => t.doneAt >= todayISO)
  const secondsToday = sessions
    .filter(s => s.endedAt >= todayISO)
    .reduce((sum, s) => sum + s.seconds, 0)

  const secondsByTask = {}
  for (const s of sessions) {
    secondsByTask[s.taskId] = (secondsByTask[s.taskId] ?? 0) + s.seconds
  }

  async function cycleProud(task) {
    await db.tasks.update(task.id, { proud: ((task.proud ?? 0) + 1) % 3 })
  }

  return (
    <div>
      <h1>Look what you did 🏆</h1>
      <p className="lede">These numbers only ever go up. No streaks, no resets, no guilt.</p>

      <div className="counters">
        <div className="counter">
          <strong>{done.length}</strong>
          <span>things finished</span>
        </div>
        <div className="counter">
          <strong>{Math.round(secondsEver / 60)}</strong>
          <span>focus minutes</span>
        </div>
        <div className="counter">
          <strong>{sessions.length}</strong>
          <span>times you showed up</span>
        </div>
        <div className="counter">
          <strong>{proudCount}</strong>
          <span>proud moments{extraProud > 0 ? ` · ${extraProud} EXTRA 🌟` : ''}</span>
        </div>
      </div>

      <div className="card">
        <p className="snippet-text">
          <strong>Today:</strong>{' '}
          {doneToday.length === 0 && secondsToday < 60
            ? 'hasn’t started counting yet — and that’s completely fine.'
            : `${doneToday.length} finished · ${fmtMinutes(secondsToday)} of focus.`}
        </p>
      </div>

      {done.length > 0 && (
        <section>
          <h2>The wins wall</h2>
          {done.slice(0, 60).map(t => (
            <div className={t.proud >= 1 ? 'card proud win-row' : 'card win-row'} key={t.id}>
              <div className="win-main">
                <p className="snippet-text">{t.title}</p>
                <p className="snippet-meta">
                  <span>
                    {fmtDay(t.doneAt)}
                    {secondsByTask[t.id] >= 60 && ` · 🔥 ${fmtMinutes(secondsByTask[t.id])}`}
                  </span>
                </p>
              </div>
              <button className={t.proud >= 1 ? 'proud-btn on' : 'proud-btn'} onClick={() => cycleProud(t)}>
                {t.proud === 2 ? '🌟 EXTRA proud' : t.proud === 1 ? '😊 proud' : 'proud?'}
              </button>
            </div>
          ))}
        </section>
      )}

      {done.length === 0 && (
        <div className="card">
          <p className="snippet-text">
            The wall is waiting for its first win. Finish anything — tiny counts — and it lands here forever. ✨
          </p>
        </div>
      )}
    </div>
  )
}
