import { Mark } from '@/components/mark'

// Full-screen calm loader shown while signing in or setting up an account.
// It stays until the board is ready; it does not pretend to show steps.
export function AuthLoading({ text }: { text: string }) {
  return (
    <div className="authload" role="status" aria-live="polite">
      <div className="authload-mark">
        <Mark size={56} />
      </div>
      <p className="authload-text">{text}</p>
      <div className="authload-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  )
}
