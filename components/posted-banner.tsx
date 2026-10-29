'use client'

import { useEffect, useState } from 'react'

export function PostedBanner() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Clean the ?posted=1 from the address so a refresh does not show it again
    window.history.replaceState(null, '', '/')
    const t = setTimeout(() => setShow(false), 4000)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
    >
      Announcement posted.
    </p>
  )
}
