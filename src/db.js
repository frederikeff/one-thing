import Dexie from 'dexie'

export const db = new Dexie('one-thing')

db.version(1).stores({
  tasks: 'id, createdAt, doneAt, todayKey',
  sessions: 'id, taskId, startedAt',
  settings: 'key',
})

export function newId() {
  return crypto.randomUUID()
}

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// Ask the browser to never evict this data under storage pressure.
export async function requestPersistence() {
  if (navigator.storage?.persist) {
    return navigator.storage.persist()
  }
  return false
}

export async function exportAll() {
  const [tasks, sessions, settings] = await Promise.all([
    db.tasks.toArray(),
    db.sessions.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: 'one-thing',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    sessions,
    settings,
  }
}

export async function importAll(data) {
  if (data?.app !== 'one-thing') throw new Error('This is not a One Thing backup file.')
  await db.transaction('rw', db.tasks, db.sessions, db.settings, async () => {
    await db.tasks.bulkPut(data.tasks ?? [])
    await db.sessions.bulkPut(data.sessions ?? [])
    await db.settings.bulkPut(data.settings ?? [])
  })
  return {
    tasks: (data.tasks ?? []).length,
    sessions: (data.sessions ?? []).length,
  }
}
