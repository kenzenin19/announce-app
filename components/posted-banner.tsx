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
    <p role="status" className="notice notice-pos">
      Announcement posted. Everyone has been notified.
    </p>
  )
}
