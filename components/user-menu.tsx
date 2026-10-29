'use client'

import { useEffect, useRef, useState } from 'react'
import { LogoutButton } from '@/components/logout-button'

// Each person gets a stable pale tint of their own hue (identity, not data).
function tint(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return { background: `hsl(${h} 55% 90%)`, color: `hsl(${h} 45% 24%)` }
}

export function UserMenu({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const initial = (name.trim()[0] ?? '?').toUpperCase()

  return (
    <div className="anchor" ref={ref}>
      <button
        type="button"
        className="avatarbtn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${name}`}
      >
        <span className="avatar" style={tint(name)}>
          {initial}
        </span>
      </button>

      {open && (
        <div className="pop pop-narrow">
          <div className="menu-who">
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
          <div className="menu-act">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  )
}
