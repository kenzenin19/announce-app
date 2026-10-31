import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { AnnTags } from '@/components/ann-tags'
import { getCurrentUser } from '@/lib/auth'
import { authorName, formatDateTime, formatShort } from '@/lib/format'
import { AdminTabs } from './admin-tabs'
import { RoleSelect } from './role-select'
import { DeleteRowButton } from './delete-row-button'
import './admin.css'

export default async function AdminPage() {
  const { supabase, user, role } = await getCurrentUser()
  if (role !== 'admin') redirect('/')

  const now = new Date()
  const nowIso = now.toISOString()
  const soonIso = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

  // All the questions at the same time
  const [members, total, overdue, soon, list] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, role, created_at')
      .order('created_at', { ascending: true }),
    supabase.from('announcements').select('id', { count: 'exact', head: true }),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .lt('due_at', nowIso),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .gte('due_at', nowIso)
      .lt('due_at', soonIso),
    supabase
      .from('announcements')
      .select(
        'id, title, due_at, created_at, subject, kind, profiles!announcements_created_by_fkey(name)'
      )
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const people = members.data ?? []
  const mods = people.filter((p) => p.role === 'mod').length
  const admins = people.filter((p) => p.role === 'admin').length
  const anns = list.data ?? []

  const stats: { label: string; value: number; note?: string }[] = [
    { label: 'Members', value: people.length, note: `${mods} mod · ${admins} admin` },
    { label: 'Announcements', value: total.count ?? 0 },
    { label: 'Due soon', value: soon.count ?? 0, note: 'within 48 hours' },
    { label: 'Overdue', value: overdue.count ?? 0, note: 'past the due date' },
  ]

  return (
    <Shell>
      <div>
        <h1 className="title">Admin</h1>
        <p className="sub">Members, announcements and what people have been doing.</p>
      </div>

      <AdminTabs active="overview" />

      <section className="adm-stats" aria-label="Counts">
        {stats.map((s) => (
          <div key={s.label} className="adm-stat">
            <p className="adm-stat-n">{s.value}</p>
            <p className="adm-stat-l">{s.label}</p>
            {s.note && <p className="adm-stat-note">{s.note}</p>}
          </div>
        ))}
      </section>

      <section className="panel" aria-labelledby="members-h">
        <h2 className="panel-h adm-h" id="members-h">
          Members
        </h2>
        {members.error ? (
          <p className="err adm-pad" role="alert">
            Couldn&apos;t load members: {members.error.message}
          </p>
        ) : (
          <ul className="adm-list">
            {people.map((p) => (
              <li key={p.id as string} className="adm-item">
                <div className="adm-main">
                  <p className="adm-name">
                    {(p.name as string) || 'No name'}
                    {p.id === user.id ? <span className="adm-you"> (you)</span> : null}
                  </p>
                  <p className="hint">Joined {formatShort(p.created_at as string)}</p>
                </div>
                <RoleSelect
                  userId={p.id as string}
                  name={(p.name as string) || 'this member'}
                  initialRole={p.role as string}
                  isSelf={p.id === user.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="anns-h">
        <h2 className="panel-h adm-h" id="anns-h">
          Announcements
        </h2>
        {list.error ? (
          <p className="err adm-pad" role="alert">
            Couldn&apos;t load announcements: {list.error.message}
          </p>
        ) : anns.length === 0 ? (
          <p className="empty adm-pad">Nothing posted yet.</p>
        ) : (
          <ul className="adm-list">
            {anns.map((a) => (
              <li key={a.id as string} className="adm-item">
                <div className="adm-main">
                  <AnnTags subject={a.subject as string} kind={a.kind as string} />
                  <p className="adm-name">
                    <Link href={`/announcements/${a.id}`} className="adm-link">
                      {a.title as string}
                    </Link>
                  </p>
                  <p className="hint">
                    {a.due_at ? `Due ${formatShort(a.due_at as string)}` : 'No due date'}
                    {' · '}
                    {authorName(a.profiles) ?? 'Unknown'}
                    {' · '}
                    {formatDateTime(a.created_at as string)}
                  </p>
                </div>
                <div className="adm-actions">
                  <Link
                    href={`/announcements/${a.id}/edit`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Pencil size={14} strokeWidth={1.75} aria-hidden="true" />
                    Edit
                  </Link>
                  <DeleteRowButton id={a.id as string} title={a.title as string} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {anns.length === 100 && (
          <p className="hint adm-pad">Showing the newest 100.</p>
        )}
      </section>
    </Shell>
  )
}
