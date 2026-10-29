'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  removeSubscription,
  saveSubscription,
  sendTestPush,
} from '@/app/push-actions'

type Status = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on'

const VAPID_PUBLIC = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '')
  .replace(/[\s"']/g, '')
  .replace(/=+$/, '')
const DISMISS_KEY = 'push-banner-dismissed-at'
const DISMISS_DAYS = 3

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function toPayload(sub: PushSubscription) {
  const json = sub.toJSON()
  return {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
    userAgent: navigator.userAgent,
  }
}

export function PushToggle({ variant }: { variant: 'banner' | 'compact' }) {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [hidden, setHidden] = useState(false)

  const detect = useCallback(async () => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    if (!supported) {
      setStatus(isIos() && !isStandalone() ? 'ios-install' : 'unsupported')
      return
    }
    if (!VAPID_PUBLIC) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub && Notification.permission === 'granted') {
        setStatus('on')
        // Re-save quietly so this device belongs to whoever is logged in now
        saveSubscription(toPayload(sub))
      } else {
        setStatus('off')
      }
    } catch {
      setStatus('off')
    }
  }, [])

  useEffect(() => {
    detect()
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
      if (Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000) setHidden(true)
    } catch {
      // storage blocked: just show the banner
    }
  }, [detect])

  async function enable() {
    setBusy(true)
    setMessage(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'off')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        }))

      const res = await saveSubscription(toPayload(sub))
      if (res.error) throw new Error(res.error)

      setStatus('on')
      setMessage({ ok: true, text: 'Notifications are on.' })
    } catch (e) {
      setMessage({
        ok: false,
        text: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await removeSubscription(endpoint)
      }
      setStatus('off')
    } catch (e) {
      setMessage({
        ok: false,
        text: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setBusy(true)
    const res = await sendTestPush()
    setMessage({ ok: res.ok, text: res.message })
    setBusy(false)
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
    setHidden(true)
  }

  if (status === 'loading') return null

  // ---------- Big banner on the home page ----------
  if (variant === 'banner') {
    if (hidden) return null
    if (status !== 'off' && status !== 'ios-install' && status !== 'denied') {
      return null
    }

    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
        {status === 'off' && (
          <>
            <div>
              <p className="font-medium">Turn on notifications</p>
              <p className="text-indigo-900/70">
                Get alerts for new announcements and reminders.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={enable} disabled={busy}>
                {busy ? 'Turning on...' : 'Turn on'}
              </Button>
              <Button size="sm" variant="outline" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </>
        )}
        {status === 'ios-install' && (
          <>
            <p>
              On iPhone, add this app to your Home Screen first (Share, then Add
              to Home Screen) to turn on notifications.
            </p>
            <Button size="sm" variant="outline" onClick={dismiss}>
              Got it
            </Button>
          </>
        )}
        {status === 'denied' && (
          <>
            <p>
              Notifications are blocked. Allow them in your browser&apos;s site
              settings, then reload.
            </p>
            <Button size="sm" variant="outline" onClick={dismiss}>
              Got it
            </Button>
          </>
        )}
        {message && !message.ok && (
          <p className="w-full text-red-600">{message.text}</p>
        )}
      </div>
    )
  }

  // ---------- Small row inside the bell dropdown ----------
  return (
    <div className="border-b px-3 py-2 text-xs">
      {status === 'on' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-green-700">Notifications are on</span>
          <span className="flex gap-3">
            <button
              type="button"
              onClick={sendTest}
              disabled={busy}
              className="underline"
            >
              Send test
            </button>
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className="underline"
            >
              Turn off
            </button>
          </span>
        </div>
      )}
      {status === 'off' && (
        <Button size="sm" className="w-full" onClick={enable} disabled={busy}>
          {busy ? 'Turning on...' : 'Turn on notifications'}
        </Button>
      )}
      {status === 'denied' && (
        <p className="text-muted-foreground">
          Notifications are blocked. Allow them in your browser&apos;s site
          settings.
        </p>
      )}
      {status === 'ios-install' && (
        <p className="text-muted-foreground">
          On iPhone, add this app to your Home Screen first to get notifications.
        </p>
      )}
      {status === 'unsupported' && (
        <p className="text-muted-foreground">
          Notifications aren&apos;t supported in this browser.
        </p>
      )}
      {message && (
        <p className={`mt-1 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
