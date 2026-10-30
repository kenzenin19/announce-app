'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { createAnnouncement } from '../actions'
import { KINDS, SUBJECTS } from '@/lib/options'

export function NewAnnouncementForm() {
  const [state, formAction, pending] = useActionState(
    createAnnouncement,
    undefined
  )

  // The datetime-local box gives a time with no timezone. We convert it to a
  // full ISO time in the browser so the server stores the right moment.
  const [due, setDue] = useState('')
  const dueIso = due ? new Date(due).toISOString() : ''

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          className="input"
          required
          maxLength={200}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <select id="subject" name="subject" className="input select" defaultValue="None">
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="kind">Type</label>
          <select id="kind" name="kind" className="input select" defaultValue="None">
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="body">Details</label>
        <textarea id="body" name="body" rows={6} className="textarea" />
      </div>

      <div className="field">
        <label htmlFor="due">Due date</label>
        <input
          id="due"
          type="datetime-local"
          className="input"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-describedby="due-hint"
        />
        <input type="hidden" name="due_at" value={dueIso} />
        <p id="due-hint" className="hint">
          Optional. Leave it empty for an announcement with no deadline.
        </p>
      </div>

      {state?.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Posting...' : 'Post announcement'}
        </button>
        <Link href="/" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  )
}
