import { dueStatus, formatShort } from '@/lib/format'

// The due date as plain text. Only urgent states get a pill, one mark per row.
export function DueBadge({ dueAt }: { dueAt: string | null }) {
  const status = dueStatus(dueAt)

  if (status === 'none' || !dueAt) {
    return <span className="due due-none">No due date</span>
  }

  return (
    <span className="due">
      {status === 'overdue' && <span className="pill pill-neg">Overdue</span>}
      {status === 'soon' && <span className="pill pill-warn">Due soon</span>}
      <span>
        {status === 'overdue' ? 'Was due' : 'Due'} {formatShort(dueAt)}
      </span>
    </span>
  )
}
