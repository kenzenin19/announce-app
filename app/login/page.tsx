'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from './actions'
import { AuthLoading } from '@/components/auth-loading'
import { Mark } from '@/components/mark'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <main className="auth">
      {pending && <AuthLoading text="Signing you in…" />}
      <div className="auth-in">
        <div className="auth-brand">
          <Mark />
          CSB Announcements
        </div>

        <div>
          <h1>Log in</h1>
          <p className="sub">Announcements, due dates and your own plan.</p>
        </div>

        <form action={formAction} className="form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              required
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <p className="err" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={pending}
          >
            {pending ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-alt">
          No account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  )
}
