import Link from 'next/link'
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
  return (
    <li className={`rowwrap ${done ? 'row-done' : ''}`}>
      <Link href={`/announcements/${a.id}`} className="row">
        {/* Phones: the pill sits in the top-right corner */}
        {!done && (
          <span className="row-pill phone-only">
            <DueBadge dueAt={a.due_at} variant="pill" />
          </span>
        )}
        <div style={{ minWidth: 0 }} className={hasPill ? 'has-pill' : undefined}>
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
      />
    </li>
  )
}
