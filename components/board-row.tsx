'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { Maximize2, Minimize2, Pencil } from 'lucide-react'
import { AnnTags } from '@/components/ann-tags'
import { DoneToggle } from '@/components/done-toggle'
import { DueBadge } from '@/components/due-badge'
import { dueStatus, formatDateTime, formatShort } from '@/lib/format'
import type { BoardItem } from '@/components/board-types'

// One announcement row (used by the list and by the calendar's day list).
// The corner icon opens the full details right under the row.
export function BoardRow({ a }: { a: BoardItem }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const done = a.done
  const st = dueStatus(a.due_at)
  const hasPill = !done && (st === 'overdue' || st === 'soon')
  const overdue = !done && st === 'overdue'
  const isNew = !done && a.isNew && !overdue

  return (
    <li
      className={`${done ? 'row-done' : ''} ${overdue ? 'row-overdue' : ''} ${
        isNew ? 'row-new' : ''
      } ${open ? 'row-open' : ''}`}
    >
      <div className="rowwrap has-expand">
        <Link href={`/announcements/${a.id}`} className="row">
          {/* Phones: the pill sits in the top-right corner */}
          {!done && (
            <span className="row-pill phone-only">
              <DueBadge dueAt={a.due_at} variant="pill" />
            </span>
          )}
          <div style={{ minWidth: 0 }} className={hasPill ? 'has-pill' : undefined}>
            {isNew && <span className="sr-only">New. </span>}
            <AnnTags subject={a.subject} kind={a.kind} />
            {/* Phones: the due date sits under the subject and type */}
            {!done && (
              <p className="row-due phone-only">
                <DueBadge dueAt={a.due_at} variant="text" />
                {a.doAt ? <span className="do">Do {formatShort(a.doAt)}</span> : null}
              </p>
            )}
            <h2 className="row-title">{a.title}</h2>
            {a.body && <p className="row-body">{a.body}</p>}
            {overdue && (
              <p className="overdue-note desk-only">Mark done if already done.</p>
            )}
          </div>
          {/* Desktop: pill and date on the right */}
          {!done && (
            <div className="row-side desk-only">
              <DueBadge dueAt={a.due_at} />
              {a.doAt ? <span className="do">Do {formatShort(a.doAt)}</span> : null}
            </div>
          )}
        </Link>
        <DoneToggle
          announcementId={a.id}
          initialDone={done}
          title={a.title}
          variant="row"
          note={overdue ? 'Mark done if already done.' : undefined}
        />
        <button
          type="button"
          className="row-expand"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? `Hide details of "${a.title}"` : `Show details of "${a.title}"`}
        >
          {open ? (
            <Minimize2 size={16} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Maximize2 size={16} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id={panelId}
        className="expand"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="expand-clip">
          <div className="expand-body">
            <p className="expand-text">{a.body || 'No details.'}</p>
            <p className="expand-meta">
              {a.author ? `Posted by ${a.author}` : 'Posted'} ·{' '}
              {formatDateTime(a.created_at)}
              {a.updated_at ? ` · Edited ${formatDateTime(a.updated_at)}` : ''}
              {a.doAt ? ` · Do ${formatShort(a.doAt)}` : ''}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                href={`/announcements/${a.id}`}
                className="btn btn-secondary btn-sm"
              >
                Open announcement
              </Link>
              {a.canEdit && (
                <Link
                  href={`/announcements/${a.id}/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  <Pencil size={14} strokeWidth={1.75} aria-hidden="true" />
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
