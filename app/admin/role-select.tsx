'use client'

import { useState, useTransition } from 'react'
import { setRole } from './actions'

// A role dropdown that saves as soon as you pick. Your own row is locked.
export function RoleSelect({
  userId,
  name,
  initialRole,
  isSelf,
}: {
  userId: string
  name: string
  initialRole: string
  isSelf: boolean
}) {
  const [role, setLocal] = useState(initialRole)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function change(next: string) {
    const prev = role
    setLocal(next)
    setErr(null)
    start(async () => {
      const res = await setRole(userId, next)
      if (res.error) {
        setLocal(prev)
        setErr(res.error)
      }
    })
  }

  return (
    <div className="adm-role">
      <select
        className="input select adm-select"
        value={role}
        disabled={isSelf || pending}
        onChange={(e) => change(e.target.value)}
        aria-label={`Role for ${name}`}
        title={isSelf ? 'You cannot change your own role' : undefined}
      >
        <option value="member">Member</option>
        <option value="mod">Mod</option>
        <option value="admin">Admin</option>
      </select>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
    </div>
  )
}
