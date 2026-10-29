// All dates are shown in Philippine time so everyone sees the same thing.
const TZ = 'Asia/Manila'

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// Short form for lists: "Nov 3, 5:00 PM", with the year only when it is not this year.
export function formatShort(iso: string) {
  const d = new Date(iso)
  const year = (x: Date) =>
    x.toLocaleString('en-PH', { timeZone: TZ, year: 'numeric' })
  const sameYear = year(d) === year(new Date())
  return d.toLocaleString('en-PH', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  })
}

export type DueStatus = 'none' | 'overdue' | 'soon' | 'ok'

export function dueStatus(iso: string | null): DueStatus {
  if (!iso) return 'none'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'overdue'
  if (diff < 48 * 60 * 60 * 1000) return 'soon'
  return 'ok'
}

// A joined row can come back as an object or as a one-item array
export function firstRow<T>(value: unknown): T | null {
  const row = Array.isArray(value) ? value[0] : value
  return (row ?? null) as T | null
}

export function authorName(profile: unknown): string | null {
  return firstRow<{ name?: string }>(profile)?.name ?? null
}
