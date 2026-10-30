import Link from 'next/link'
import { Maximize2 } from 'lucide-react'
import { AnnTags } from '@/components/ann-tags'
import { DoneToggle } from '@/components/done-toggle'
import { DueBadge } from '@/components/due-badge'
import { dueStatus, formatShort } from '@/lib/format'
import type { BoardItem } from '@/components/board-types'

// One announcement row (used by the list and by the calendar's day list).
export function BoardRow({ a }: { a: BoardItem }) {
  const done = a.done
  const st = dueStatus(a.due_at)
  const hasPill = !done && (st === 'overdue' || st === 'soon')
  const overdue = !done && st === 'overdue'
  const isNew = !done && a.isNew && !overdue
  return (
    <li
      className={`rowwrap has-expand ${done ? 'row-done' : ''} ${overdue ? 'row-overdue' : ''} ${
        isNew ? 'row-new' : ''
      }`}
    >
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
          <p className="row-meta">
            {a.author ? `Posted by ${a.author}` : 'Posted'}
          </p>
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
      {/* Decoration only: tapping the row still opens the announcement */}
      <span className="row-expand" aria-hidden="true">
        <Maximize2 size={14} strokeWidth={1.75} />
      </span>
    </li>
  )
}
