import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { PushToggle } from '@/components/push-toggle'
import { getCurrentUser } from '@/lib/auth'
import { NotificationSettings } from './settings-form'
import './settings.css'

export default async function SettingsPage() {
  const { supabase, user } = await getCurrentUser()

  const { data: s } = await supabase
    .from('notification_settings')
    .select('push_enabled, push_mode')
    .eq('user_id', user.id)
    .maybeSingle()

  // No saved choice yet means on + Default, exactly like before
  const enabled = s?.push_enabled ?? true
  const mode = (s?.push_mode === 'light' ? 'light' : 'default') as
    | 'light'
    | 'default'

  return (
    <Shell>
      <div>
        <Link href="/" className="back">
          <ArrowLeft size={16} aria-hidden="true" />
          Announcements
        </Link>
        <h1 className="title" style={{ marginTop: 8 }}>
          Settings
        </h1>
        <p className="sub">Choose how you want to be notified.</p>
      </div>

      <section className="panel panel-pad" aria-labelledby="notif-h">
        <h2 className="panel-h" id="notif-h">
          Notifications
        </h2>
        <NotificationSettings initialEnabled={enabled} initialMode={mode} />
      </section>

      <section className="panel panel-pad" aria-labelledby="device-h">
        <h2 className="panel-h" id="device-h">
          This device
        </h2>
        <p className="hint" style={{ margin: '4px 0 12px' }}>
          Each phone or browser has to allow notifications once. This is separate
          from the choice above.
        </p>
        <PushToggle variant="compact" />
      </section>
    </Shell>
  )
}
