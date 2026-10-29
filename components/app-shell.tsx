import Link from 'next/link'
import { getCurrentUser, canPost } from '@/lib/auth'
import { NotificationBell } from '@/components/notification-bell'
import { AppNav } from '@/components/app-nav'
import { UserMenu } from '@/components/user-menu'
import { Mark } from '@/components/mark'

// The frame every signed-in screen sits in: top bar, content column, phone tab bar.
export async function Shell({ children }: { children: React.ReactNode }) {
  const { name, role } = await getCurrentUser()
  const poster = canPost(role)

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <Link href="/" className="brand" aria-label="CSB Announcements, home">
            <Mark />
            <span className="brand-name-long">CSB Announcements</span>
            <span className="brand-name-short">CSB</span>
          </Link>
          <AppNav canPost={poster} variant="top" />
          <div className="topbar-right">
            <NotificationBell />
            <UserMenu name={name} role={role} />
          </div>
        </div>
      </header>

      <main className="wrap page">{children}</main>

      <AppNav canPost={poster} variant="tabs" />
    </>
  )
}
