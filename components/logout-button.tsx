'use client'

import { useFormStatus } from 'react-dom'
import { logout } from '@/app/login/actions'

function Inner() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="btn btn-secondary btn-block"
      disabled={pending}
    >
      {pending ? 'Logging out...' : 'Log out'}
    </button>
  )
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <Inner />
    </form>
  )
}
