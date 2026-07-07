// Local-timezone day key, e.g. '2026-07-07'. A task marked "today" stores this key;
// on a new day old marks simply stop matching — tasks drift back to the pile with no
// overdue state and no guilt.
export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfTodayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function fmtDay(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export function fmtMinutes(seconds) {
  const m = Math.round(seconds / 60)
  if (m < 1) return 'under a minute'
  return m === 1 ? '1 minute' : `${m} minutes`
}
