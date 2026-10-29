'use client'

import { Button } from '@/components/ui/button'

export function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Delete this announcement? This cannot be undone.')) {
          e.preventDefault()
        }
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Delete
      </Button>
    </form>
  )
}
