'use client'

import { removeAnnouncement } from './actions'

export function DeleteRowButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={removeAnnouncement.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <button type="submit" className="btn btn-danger btn-sm">
        Delete
      </button>
    </form>
  )
}
