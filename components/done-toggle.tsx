'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { setDone } from '@/app/announcements/done-actions'

// "row": a round check button at the left of a list row.
// "detail": a button in the title row of the announcement page.
export function DoneToggle({
  announcementId,
  initialDone,
  title,
  variant,
}: {
  announcementId: string
  initialDone: boolean
  title: string
  variant: 'row' | 'detail'
}) {
  const [done, setLocal] = useState(initialDone)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const btnRef = useRef<HTMLButtonElement>(null)

  // A calm exit: the row tints, then folds away. Then the server moves it.
  function animateOut(): Promise<() => void> {
    const li = btnRef.current?.closest('li') as HTMLElement | null
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!li || reduced) return Promise.resolve(() => {})

    li.classList.add('row-leaving')
    const reset = () => {
      li.classList.remove('row-leaving', 'row-collapse')
      li.style.height = ''
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        li.style.height = `${li.offsetHeight}px`
        void li.offsetHeight // let the browser register the height
        li.classList.add('row-collapse')
        li.style.height = '0px'
        setTimeout(() => resolve(reset), 280)
      }, 380)
    })
  }

  // Follow the server after the page refreshes
  useEffect(() => setLocal(initialDone), [initialDone])

  function toggle() {
    const next = !done
    setLocal(next)
    setErr(null)
    start(async () => {
      const reset = variant === 'row' ? await animateOut() : () => {}
      const res = await setDone(announcementId, next)
      if (res.error) {
        reset()
        setLocal(!next)
        setErr(res.error)
      }
    })
  }

  if (variant === 'row') {
    return (
      <div className="donecol">
        <button
          ref={btnRef}
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={done}
          aria-label={
            done ? `Mark "${title}" as not done` : `Mark "${title}" as done`
          }
          title={err ?? undefined}
          className={`btn btn-secondary btn-sm ${done ? '' : 'btn-markdone'}`}
        >
          {!done && <Check size={14} strokeWidth={2.25} aria-hidden="true" />}
          {done ? 'Undo' : 'Done'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={done}
        className={`btn btn-secondary ${done ? 'btn-done' : ''}`}
      >
        <Check size={16} strokeWidth={2} aria-hidden="true" />
        {done ? 'Done · Undo' : 'Mark as done'}
      </button>
      {err && (
        <span className="err" role="alert">
          {err}
        </span>
      )}
    </div>
  )
}
