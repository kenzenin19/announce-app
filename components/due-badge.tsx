import { dueStatus, formatShort } from '@/lib/format'

// The due date. Only urgent states get a pill, one mark per row.
//   full: pill + text together (default)
//   pill: just the pill, or nothing (used in the top-right corner on phones)
//   text: just the text, no pill (used under the tags on phones)
export function DueBadge({
  dueAt,
  variant = 'full',
}: {
  dueAt: string | null
  variant?: 'full' | 'pill' | 'text'
}) {
  const status = dueStatus(dueAt)

  const pill =
    status === 'overdue' ? (
      <span className="pill pill-neg">Overdue</span>
    ) : status === 'soon' ? (
      <span className="pill pill-warn">Due soon</span>
    ) : null

  if (variant === 'pill') return pill

  if (status === 'none' || !dueAt) {
    return <span className="due due-none">No due date</span>
  }

  return (
    <span className="due">
      {variant === 'full' && pill}
      <span>
        {status === 'overdue' ? 'Was due' : 'Due'} {formatShort(dueAt)}
      </span>
    </span>
  )
}
