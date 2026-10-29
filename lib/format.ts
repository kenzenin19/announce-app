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

// The joined profile can come back as an object or an array
export function authorName(profile: unknown): string | null {
  const row = Array.isArray(profile) ? profile[0] : profile
  return (row as { name?: string } | null | undefined)?.name ?? null
}
