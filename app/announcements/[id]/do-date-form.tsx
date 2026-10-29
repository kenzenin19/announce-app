'use client'

import { useEffect, useState, useTransition } from 'react'
import { setDoDate, clearDoDate } from '../do-date-actions'
import { formatDateTime } from '@/lib/format'

// Turns a saved time into the "YYYY-MM-DDTHH:mm" text a datetime-local box needs,
// in the viewer's own timezone.
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function DoDateForm({
  announcementId,
  initialDoAt,
  dueAt,
}: {
  announcementId: string
  initialDoAt: string | null
  dueAt: string | null
}) {
  const [value, setValue] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(initialDoAt)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  // Filled in after the page loads so it uses the viewer's timezone
  useEffect(() => {
    setValue(initialDoAt ? toLocalInput(initialDoAt) : '')
    setSavedAt(initialDoAt)
  }, [initialDoAt])

  const afterDue =
    value && dueAt && new Date(value).getTime() > new Date(dueAt).getTime()

  function save() {
    if (!value) {
      setMsg({ ok: false, text: 'Pick a date and time first.' })
      return
    }
    const iso = new Date(value).toISOString()
    startTransition(async () => {
      const res = await setDoDate(announcementId, iso)
      if (res.error) setMsg({ ok: false, text: res.error })
      else {
        setSavedAt(iso)
        setMsg({ ok: true, text: 'Saved.' })
      }
    })
  }

  function clear() {
    startTransition(async () => {
      const res = await clearDoDate(announcementId)
      if (res.error) setMsg({ ok: false, text: res.error })
      else {
        setValue('')
        setSavedAt(null)
        setMsg({ ok: true, text: 'Removed.' })
      }
    })
  }

  return (
    <section className="panel panel-pad" aria-labelledby="do-h">
      <h2 id="do-h" className="panel-h">
        My do date
      </h2>
      <p className="sub" style={{ marginTop: 2 }}>
        {savedAt ? (
          <>
            Planned for <span className="do">{formatDateTime(savedAt)}</span>.
            Only you can see this.
          </>
        ) : (
          'When will you do this? Only you can see it, and you get a reminder.'
        )}
      </p>

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="do-at">Date and time</label>
        <input
          id="do-at"
          type="datetime-local"
          className="input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setMsg(null)
          }}
        />
      </div>

      {afterDue && (
        <p className="hint" style={{ marginTop: 8, color: 'var(--warn-ink)' }}>
          This is after the due date.
        </p>
      )}

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={pending}
        >
          {pending ? 'Saving...' : savedAt ? 'Update do date' : 'Save do date'}
        </button>
        {savedAt && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clear}
            disabled={pending}
          >
            Remove
          </button>
        )}
        {msg && (
          <span className={msg.ok ? 'ok' : 'err'} role="status">
            {msg.text}
          </span>
        )}
      </div>
    </section>
  )
}
