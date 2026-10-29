'use client'

export function DeleteButton({
  action,
  title,
}: {
  action: () => Promise<void>
  title: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <button type="submit" className="btn btn-danger">
        Delete announcement
      </button>
    </form>
  )
}
