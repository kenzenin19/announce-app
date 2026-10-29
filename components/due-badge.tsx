import { dueStatus, formatDateTime } from '@/lib/format'

export function DueBadge({ dueAt }: { dueAt: string | null }) {
  const status = dueStatus(dueAt)

  if (status === 'none' || !dueAt) {
    return <span className="text-xs text-muted-foreground">No due date</span>
  }

  const styles = {
    overdue: 'bg-red-100 text-red-700',
    soon: 'bg-amber-100 text-amber-800',
    ok: 'bg-green-100 text-green-700',
  }[status]

  const label = status === 'overdue' ? 'Overdue' : 'Due'

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}: {formatDateTime(dueAt)}
    </span>
  )
}
