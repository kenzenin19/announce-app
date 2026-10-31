'use client'

import { useState, useTransition } from 'react'
import { saveNotificationSettings } from './actions'

type Mode = 'light' | 'default'

// The account-level choice. Saves as soon as you tap.
export function NotificationSettings({
  initialEnabled,
  initialMode,
}: {
  initialEnabled: boolean
  initialMode: Mode
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  function save(nextEnabled: boolean, nextMode: Mode) {
    const prev = { enabled, mode }
    setEnabled(nextEnabled)
    setMode(nextMode)
    setStatus(null)
    start(async () => {
      const res = await saveNotificationSettings({
        enabled: nextEnabled,
        mode: nextMode,
      })
      if (res.error) {
        // Put it back so the screen never lies about what is saved
        setEnabled(prev.enabled)
        setMode(prev.mode)
        setStatus({ ok: false, text: res.error })
      } else {
        setStatus({ ok: true, text: 'Saved.' })
      }
    })
  }

  return (
    <div className="set-block">
      <div className="set-row">
        <div>
          <p className="set-label" id="notif-switch-label">
            Notifications
          </p>
          <p className="hint">
            {enabled
              ? 'Pushes are on. The bell in the app always shows everything.'
              : 'No pushes to your phone. The bell in the app still fills up.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="notif-switch-label"
          className="switch"
          disabled={pending}
          onClick={() => save(!enabled, mode)}
        >
          <span className="switch-knob" />
        </button>
      </div>

      <fieldset className="choices" disabled={!enabled || pending} data-off={!enabled}>
        <legend className="sr-only">How often to push</legend>

        <label className={`choice ${mode === 'default' ? 'choice-on' : ''}`}>
          <input
            type="radio"
            name="mode"
            value="default"
            checked={mode === 'default'}
            onChange={() => save(enabled, 'default')}
          />
          <span>
            <span className="choice-title">Default</span>
            <span className="choice-text">
              A push the moment something is posted or edited, plus every
              reminder.
            </span>
          </span>
        </label>

        <label className={`choice ${mode === 'light' ? 'choice-on' : ''}`}>
          <input
            type="radio"
            name="mode"
            value="light"
            checked={mode === 'light'}
            onChange={() => save(enabled, 'light')}
          />
          <span>
            <span className="choice-title">Light</span>
            <span className="choice-text">
              One push a day at 7:00 am, like &ldquo;Today: 3 new · 2 overdue ·
              4 due soon&rdquo;. Your own do-date reminders still arrive on
              time.
            </span>
          </span>
        </label>
      </fieldset>

      {status && (
        <p className={status.ok ? 'ok' : 'err'} role={status.ok ? 'status' : 'alert'}>
          {status.text}
        </p>
      )}
    </div>
  )
}
