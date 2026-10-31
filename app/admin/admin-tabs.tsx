import Link from 'next/link'

// Two tabs at the top of the admin pages.
export function AdminTabs({ active }: { active: 'overview' | 'activity' }) {
  return (
    <nav className="adm-tabs" aria-label="Admin sections">
      <Link
        href="/admin"
        className={active === 'overview' ? 'adm-tab adm-tab-on' : 'adm-tab'}
        aria-current={active === 'overview' ? 'page' : undefined}
      >
        Overview
      </Link>
      <Link
        href="/admin/activity"
        className={active === 'activity' ? 'adm-tab adm-tab-on' : 'adm-tab'}
        aria-current={active === 'activity' ? 'page' : undefined}
      >
        Activity
      </Link>
    </nav>
  )
}
