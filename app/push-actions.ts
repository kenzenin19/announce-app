'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'

type Result = { error?: string }

async function currentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Saves this browser/phone so it can receive pushes for the logged-in person.
export async function saveSubscription(sub: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}): Promise<Result> {
  try {
    const userId = await currentUserId()
    if (!userId) return { error: 'You are signed out. Please log in again.' }
    if (!sub.endpoint || !sub.p256dh || !sub.auth) {
      return { error: 'That subscription is not valid.' }
    }

    // Service role: if someone else used this browser before, it moves to the new person
    const admin = createAdminClient()
    const { error } = await admin.from('push_subscriptions').upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        user_agent: sub.userAgent ?? null,
        user_id: userId,
      },
      { onConflict: 'endpoint' }
    )
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not save.' }
  }
}

export async function removeSubscription(endpoint: string): Promise<Result> {
  try {
    const userId = await currentUserId()
    if (!userId) return { error: 'You are signed out. Please log in again.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', userId)
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not remove.' }
  }
}

// "Send test" button: proves the keys and the browser are set up correctly.
export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  try {
    const userId = await currentUserId()
    if (!userId) return { ok: false, message: 'You are signed out.' }

    const res = await sendPushToUser(userId, {
      title: 'CSB Announcements',
      body: 'Test notification. It works!',
      url: '/',
      tag: 'test',
    })

    if ('error' in res && res.error) return { ok: false, message: res.error }
    if (res.sent === 0) {
      return {
        ok: false,
        message: 'No device is registered yet. Turn notifications off and on again.',
      }
    }
    return { ok: true, message: `Sent to ${res.sent} device(s).` }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Test failed.' }
  }
}
