import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '@/components/app-shell'
import { getCurrentUser } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { AdminTabs } from '../admin-tabs'
import '../admin.css'

const PAGE_SIZE = 50

const ACTIONS: Record<string, string> = {
  posted: 'Posted',
  edited: 'Edited',
  deleted: 'Deleted',
  role_changed: 'Role changed',
  signed_up: 'Signed up',
  login: 'Logged in',
  settings: 'Changed settings',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Entry = {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  announcement_id: string | null
  detail: string | null
  created_at: string
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; action?: string }>
}) {
  const { supabase, role } = await getCurrentUser()
  if (role !== 'admin') redirect('/')

  const sp = await searchParams
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const userFilter = sp.user && UUID.test(sp.user) ? sp.user : ''
  const actionFilter = sp.action && ACTIONS[sp.action] ? sp.action : ''
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('activity_log')
    .select('id, user_id, user_name, action, announcement_id, detail, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (userFilter) query = query.eq('user_id', userFilter)
  if (actionFilter) query = query.eq('action', actionFilter)

  const [{ data, count, error }, { data: people }] = await Promise.all([
    query,
    supabase.from('profiles').select('id, name').order('name', { ascending: true }),
  ])

  const entries = (data ?? []) as Entry[]
  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Only link to announcements that still exist
  const ids = [
    ...new Set(
      entries
        .filter((e) => e.announcement_id && e.action !== 'deleted')
        .map((e) => e.announcement_id as string)
    ),
  ]
  const alive = new Set<string>()
  if (ids.length) {
    const { data: found } = await supabase
      .from('announcements')
      .select('id')
      .in('id', ids)
    for (const r of found ?? []) alive.add(r.id as string)
  }

  function pageHref(n: number) {
    const q = new URLSearchParams()
    if (userFilter) q.set('user', userFilter)
    if (actionFilter) q.set('action', actionFilter)
    if (n > 1) q.set('page', String(n))
    const s = q.toString()
    return s ? `/admin/activity?${s}` : '/admin/activity'
  }

  return (
    <Shell>
      <div>
        <h1 className="title">Admin</h1>
        <p className="sub">Members, announcements and what people have been doing.</p>
      </div>

      <AdminTabs active="activity" />

      <form method="get" action="/admin/activity" className="adm-filters">
        <div className="field">
          <label htmlFor="f-user">Person</label>
          <select
            id="f-user"
            name="user"
            className="input select"
            defaultValue={userFilter}
          >
            <option value="">Everyone</option>
            {(people ?? []).map((p) => (
              <option key={p.id as string} value={p.id as string}>
                {(p.name as string) || 'No name'}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-action">What</label>
          <select
            id="f-action"
            name="action"
            className="input select"
            defaultValue={actionFilter}
          >
            <option value="">Everything</option>
            {Object.entries(ACTIONS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-filter-btns">
          <button type="submit" className="btn btn-primary">
            Filter
          </button>
          {(userFilter || actionFilter) && (
            <Link href="/admin/activity" className="btn btn-secondary">
              Clear
            </Link>
          )}
        </div>
      </form>

      <section className="panel" aria-label="Activity">
        {error ? (
          <p className="err adm-pad" role="alert">
            Couldn&apos;t load activity: {error.message}
          </p>
        ) : entries.length === 0 ? (
          <p className="empty adm-pad">
            {userFilter || actionFilter
              ? 'No activity matches that filter.'
              : 'No activity yet. It shows up here as people use the app.'}
          </p>
        ) : (
          <ul className="adm-list">
            {entries.map((e) => (
              <li key={e.id} className="adm-item adm-item-top">
                <div className="adm-main">
                  <p className="adm-name">
                    {e.user_name ?? 'System'}
                    <span className={`adm-pill adm-pill-${e.action}`}>
                      {ACTIONS[e.action] ?? e.action}
                    </span>
                  </p>
                  {e.detail ? (
                    e.announcement_id && alive.has(e.announcement_id) ? (
                      <Link
                        href={`/announcements/${e.announcement_id}`}
                        className="adm-link adm-detail"
                      >
                        {e.detail}
                      </Link>
                    ) : (
                      <p className="adm-detail">{e.detail}</p>
                    )
                  ) : null}
                </div>
                <time className="adm-time" dateTime={e.created_at}>
                  {formatDateTime(e.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="adm-pager">
        <p className="hint">
          {total === 0
            ? ''
            : `${from + 1}–${Math.min(from + PAGE_SIZE, total)} of ${total}`}
          {total > 0 ? ' · kept for 90 days' : ''}
        </p>
        <div className="adm-pager-btns">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn btn-secondary btn-sm">
              Newer
            </Link>
          )}
          {page < pages && (
            <Link href={pageHref(page + 1)} className="btn btn-secondary btn-sm">
              Older
            </Link>
          )}
        </div>
      </div>
    </Shell>
  )
}
