'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatShort } from '@/lib/format'

type Notif = {
  id: string
  announcement_id: string | null
  message: string
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [items, setItems] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, announcement_id, message, read, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setItems(data as Notif[])
  }, [supabase])

  // Load now, then listen for new/changed notifications live
  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      await load()
      if (cancelled) return

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            load()
          }
        )
        .subscribe()
    })()

    // Backup: refresh when the person comes back to this tab
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, load])

  // Close the dropdown when clicking outside it
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const unread = items.filter((n) => !n.read).length

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('read', false)
  }

  async function openNotif(n: Notif) {
    setOpen(false)
    if (!n.read) markRead(n.id)
    if (n.announcement_id) router.push(`/announcements/${n.announcement_id}`)
  }

  return (
    <div className="anchor" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="iconbtn"
      >
        <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="pop">
          <div className="pop-h">
            <span>Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="linklike">
                Mark all as read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="empty" style={{ margin: 16 }}>
              No notifications yet.
            </p>
          ) : (
            <ul className="pop-scroll">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotif(n)}
                    className={`notif ${n.read ? '' : 'notif-unread'}`}
                  >
                    <span className="notif-dot" aria-hidden="true" />
                    <span>
                      <span className="notif-msg">{n.message}</span>
                      <span className="notif-time">
                        {formatShort(n.created_at)}
                        {n.read ? '' : ' · unread'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
