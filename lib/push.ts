import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

export type PushPayload = {
  title: string
  body: string
  url: string
  tag?: string
}

let configured = false

function configure() {
  if (configured) return true

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) return false

  webpush.setVapidDetails(subject, pub, priv)
  configured = true
  return true
}

// Sends one push to every device this person has turned notifications on for.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configure()) {
    return {
      sent: 0,
      failed: 0,
      error: 'Push is not set up: missing VAPID keys in the server settings.',
    }
  }

  const admin = createAdminClient()
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) return { sent: 0, failed: 0, error: error.message }

  const body = JSON.stringify(payload)
  const dead: string[] = []
  let sent = 0
  let failed = 0

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60 * 24 }
        )
        sent++
      } catch (e) {
        failed++
        const code = (e as { statusCode?: number }).statusCode
        // 404 / 410 mean the device unsubscribed or uninstalled: clean it up
        if (code === 404 || code === 410) dead.push(s.id)
      }
    })
  )

  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('id', dead)
  }

  return { sent, failed }
}
