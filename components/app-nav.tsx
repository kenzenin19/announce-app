'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListChecks, Megaphone, Plus } from 'lucide-react'

export function AppNav({
  canPost,
  variant,
}: {
  canPost: boolean
  variant: 'top' | 'tabs'
}) {
  const path = usePathname() ?? '/'

  const onBoard =
    path === '/' ||
    (path.startsWith('/announcements') && !path.startsWith('/announcements/new'))
  const onNew = path.startsWith('/announcements/new')
  const onTasks = path.startsWith('/my-tasks')

  const cur = (on: boolean) => (on ? ('page' as const) : undefined)

  if (variant === 'top') {
    return (
      <nav className="topnav" aria-label="Main">
        <Link href="/" aria-current={cur(onBoard)}>
          Announcements
        </Link>
        <Link href="/my-tasks" aria-current={cur(onTasks)}>
          My do dates
        </Link>
      </nav>
    )
  }

  return (
    <nav className="tabbar" aria-label="Main">
      <Link href="/" aria-current={cur(onBoard)}>
        <Megaphone size={20} strokeWidth={1.75} aria-hidden="true" />
        Board
      </Link>
      {canPost && (
        <Link href="/announcements/new" aria-current={cur(onNew)}>
          <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
          New
        </Link>
      )}
      <Link href="/my-tasks" aria-current={cur(onTasks)}>
        <ListChecks size={20} strokeWidth={1.75} aria-hidden="true" />
        Do dates
      </Link>
    </nav>
  )
}
