import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting, setSetting, importAll } from '../db.js'
import { downloadBackup } from '../lib/backup.js'

export default function More() {
  const name = useLiveQuery(() => getSetting('name', ''), [], '')
  const soundOn = useLiveQuery(() => getSetting('soundOn', true), [], true)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  async function restore(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const counts = await importAll(data)
      setMessage(`Restored ${counts.tasks} tasks and ${counts.sessions} focus sessions. 💛`)
    } catch (err) {
      setMessage(err.message || 'That file didn’t work — try another backup.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <h1>More 🌿</h1>

      <div className="card">
        <label className="field-label" htmlFor="name">What should the app call you?</label>
        <input
          id="name"
          value={name}
          placeholder="Your name"
          onChange={e => setSetting('name', e.target.value)}
        />
      </div>

      <div className="card">
        <div className="capture-row">
          <span>Gentle chime when the timer ends</span>
          <button className={soundOn ? 'chip on' : 'chip'} onClick={() => setSetting('soundOn', !soundOn)}>
            {soundOn ? 'on 🔔' : 'off 🔕'}
          </button>
        </div>
      </div>

      <h2>Backup</h2>
      <div className="card">
        <p className="sub">
          Everything lives on this device only. Download a backup now and then — especially before
          clearing browser data.
        </p>
        <div className="settings-actions">
          <button className="secondary" onClick={downloadBackup}>Download backup</button>
          <label className="file-btn">
            Restore from file
            <input ref={fileRef} type="file" accept="application/json" onChange={restore} hidden />
          </label>
        </div>
        {message && <p className="confirm">{message}</p>}
      </div>

      <h2>House rules</h2>
      <div className="card">
        <p className="snippet-text">
          One thing at a time. Small timers. Breaks with water. Everything you do gets counted and
          kept — nothing ever decreases, expires, turns red, or judges you. Stopping counts.
          Starting counts double.
        </p>
      </div>
    </div>
  )
}
