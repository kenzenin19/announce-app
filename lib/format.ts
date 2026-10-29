// All dates are shown in Philippine time so everyone sees the same thing.
const TZ = 'Asia/Manila'

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
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
