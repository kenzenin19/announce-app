'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup } from '../login/actions'
import { AuthLoading } from '@/components/auth-loading'
import { Mark } from '@/components/mark'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, undefined)

  return (
    <main className="auth">
      {pending && <AuthLoading text="Setting up your board…" />}
      <div className="auth-in">
        <div className="auth-brand">
          <Mark />
          CSB Announcements
        </div>

        <div>
          <h1>Create account</h1>
          <p className="sub">Join to see announcements and plan your tasks.</p>
        </div>

        <form action={formAction} className="form">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              className="input"
              required
              autoComplete="name"
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
              aria-describedby="pw-hint"
            />
            <p id="pw-hint" className="hint">
              At least 6 characters.
            </p>
          </div>

          {state?.error && (
            <p className="err" role="alert">
              {state.error}
            </p>
          )}
          {state?.message && (
            <p className="ok" role="status">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={pending}
          >
            {pending ? 'Creating...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  )
}
