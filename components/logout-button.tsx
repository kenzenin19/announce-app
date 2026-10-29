'use client'

import { useFormStatus } from 'react-dom'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

function Inner() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <Inner />
    </form>
  )
}
