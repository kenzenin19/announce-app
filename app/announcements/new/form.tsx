'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { createAnnouncement, updateAnnouncement } from '../actions'
import { KINDS, SUBJECTS } from '@/lib/options'

export type AnnouncementInitial = {
  id: string
  title: string
  body: string
  due_at: string | null
  subject: string | null
  kind: string | null
}

// "2026-11-05T15:00" in the browser's own timezone, which is what the
// datetime-local box expects (and how the form turns it back into a full time).
function toLocalInput(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`
}

// One form for both posting and editing. Pass `initial` to edit.
export function AnnouncementForm({ initial }: { initial?: AnnouncementInitial }) {
  const editing = Boolean(initial)
  const [state, formAction, pending] = useActionState(
    initial ? updateAnnouncement.bind(null, initial.id) : createAnnouncement,
    undefined
  )

  // The datetime-local box gives a time with no timezone. We convert it to a
  // full ISO time in the browser (when you press the button) so the server
  // stores the right moment.
  const dueRef = useRef<HTMLInputElement>(null)

  // Fill in the current due date in the browser (after load, so it matches the browser's timezone)
  const initialDue = initial?.due_at ?? null
  useEffect(() => {
    if (dueRef.current && initialDue) dueRef.current.value = toLocalInput(initialDue)
  }, [initialDue])

  function submit(formData: FormData) {
    const v = dueRef.current?.value ?? ''
    formData.set('due_at', v ? new Date(v).toISOString() : '')
    formAction(formData)
  }

  return (
    <form action={submit} className="form">
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          className="input"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ''}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            className="input select"
            defaultValue={initial?.subject ?? 'None'}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="kind">Type</label>
          <select
            id="kind"
            name="kind"
            className="input select"
            defaultValue={initial?.kind ?? 'None'}
          >
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
        <textarea
          id="body"
          name="body"
          rows={6}
          className="textarea"
          defaultValue={initial?.body ?? ''}
        />
      </div>

      <div className="field">
        <label htmlFor="due">Due date</label>
        <input
          id="due"
          type="datetime-local"
          className="input"
          ref={dueRef}
          aria-describedby="due-hint"
        />
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
          {editing
            ? pending
              ? 'Saving...'
              : 'Save changes'
            : pending
              ? 'Posting...'
              : 'Post announcement'}
        </button>
        <Link
          href={initial ? `/announcements/${initial.id}` : '/'}
          className="btn btn-secondary"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

// Kept so the New page keeps working unchanged
export function NewAnnouncementForm() {
  return <AnnouncementForm />
}
