'use client'

import { useEffect, useState, useTransition } from 'react'
import { setDoDate, clearDoDate } from '../do-date-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Turns a saved time into the "YYYY-MM-DDTHH:mm" text a datetime-local box needs,
// in the viewer's own timezone.
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function DoDateForm({
  announcementId,
  initialDoAt,
  dueAt,
}: {
  announcementId: string
  initialDoAt: string | null
  dueAt: string | null
}) {
  const [value, setValue] = useState('')
  const [hasSaved, setHasSaved] = useState(Boolean(initialDoAt))
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  // Filled in after the page loads so it uses the viewer's timezone
  useEffect(() => {
    setValue(initialDoAt ? toLocalInput(initialDoAt) : '')
    setHasSaved(Boolean(initialDoAt))
  }, [initialDoAt])

  const afterDue =
    value && dueAt && new Date(value).getTime() > new Date(dueAt).getTime()

  function save() {
    if (!value) {
      setMsg({ ok: false, text: 'Pick a date and time first.' })
      return
    }
    startTransition(async () => {
      const res = await setDoDate(announcementId, new Date(value).toISOString())
      if (res.error) setMsg({ ok: false, text: res.error })
      else {
        setHasSaved(true)
        setMsg({ ok: true, text: 'Saved.' })
      }
    })
  }

  function clear() {
    startTransition(async () => {
      const res = await clearDoDate(announcementId)
      if (res.error) setMsg({ ok: false, text: res.error })
      else {
        setValue('')
        setHasSaved(false)
        setMsg({ ok: true, text: 'Removed.' })
      }
    })
  }

  return (
    <section className="mt-4 rounded-lg border p-5">
      <h2 className="font-medium">My do date</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        When do you plan to do this? Only you can see it.
      </p>

      <div className="space-y-2">
        <Label htmlFor="do-at">Date and time</Label>
        <Input
          id="do-at"
          type="datetime-local"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setMsg(null)
          }}
        />
      </div>

      {afterDue && (
        <p className="mt-2 text-sm text-amber-700">
          Heads up: this is after the due date.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? 'Saving...' : hasSaved ? 'Update' : 'Save'}
        </Button>
        {hasSaved && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clear}
            disabled={pending}
          >
            Remove
          </Button>
        )}
        {msg && (
          <span
            className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}
            role="status"
          >
            {msg.text}
          </span>
        )}
      </div>
    </section>
  )
}
