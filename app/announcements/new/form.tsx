'use client'

import { useActionState, useState } from 'react'
import { createAnnouncement } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewAnnouncementForm() {
  const [state, formAction, pending] = useActionState(
    createAnnouncement,
    undefined
  )

  // The datetime-local box gives a time with no timezone. We convert it to a
  // full ISO time in the browser so the server stores the right moment.
  const [due, setDue] = useState('')
  const dueIso = due ? new Date(due).toISOString() : ''

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Details</Label>
        <textarea
          id="body"
          name="body"
          rows={6}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due">Due date (optional)</Label>
        <Input
          id="due"
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <input type="hidden" name="due_at" value={dueIso} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Posting...' : 'Post announcement'}
      </Button>
    </form>
  )
}
