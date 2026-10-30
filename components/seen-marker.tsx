'use client'

import { useEffect } from 'react'
import { markSeen } from '@/app/announcements/seen-actions'

// Renders nothing. Opening the announcement marks it as seen for you.
export function SeenMarker({ announcementId }: { announcementId: string }) {
  useEffect(() => {
    markSeen(announcementId).catch(() => {})
  }, [announcementId])
  return null
}
