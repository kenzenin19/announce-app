// NOTE: On Next.js 16, rename this file to proxy.ts and rename the
// function below from "middleware" to "proxy". Nothing else changes.
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Skip static files, images, and the PWA files we add on Day 5
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
