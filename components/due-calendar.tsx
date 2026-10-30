'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BoardRow } from '@/components/board-row'
import type { BoardItem } from '@/components/board-types'
import { dueStatus } from '@/lib/format'

const TZ = 'Asia/Manila'
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayKey(d: string | Date) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: TZ })
}
function keyOf(y: number, m: number, d: number) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${y}-${p(m + 1)}-${p(d)}`
}
function stateOf(i: BoardItem) {
  if (i.done) return 'done'
  const s = dueStatus(i.due_at)
  return s === 'overdue' ? 'over' : s === 'soon' ? 'soon' : 'ok'
}
function labelOf(key: string) {
  return new Date(`${key}T12:00:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// Month calendar of due dates. Tap a day to see its announcements underneath.
export function DueCalendar({ items }: { items: BoardItem[] }) {
  const todayKey = dayKey(new Date())
  const [ty, tm] = todayKey.split('-').map(Number)
  const [ym, setYm] = useState({ y: ty, m: tm - 1 })
  const [sel, setSel] = useState(todayKey)

  const byDay = useMemo(() => {
    const map = new Map<string, BoardItem[]>()
    for (const i of items) {
      if (!i.due_at) continue
      const k = dayKey(i.due_at)
      map.set(k, [...(map.get(k) ?? []), i])
    }
    return map
  }, [items])

  const noDue = items.filter((i) => !i.due_at).length

  const lead = new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay()
  const dim = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ]
  while (cells.length % 7) cells.push(null)

  function go(delta: number) {
    const d = new Date(Date.UTC(ym.y, ym.m + delta, 1))
    const next = { y: d.getUTCFullYear(), m: d.getUTCMonth() }
    setYm(next)
    setSel(
      next.y === ty && next.m === tm - 1 ? todayKey : keyOf(next.y, next.m, 1)
    )
  }
  function goToday() {
    setYm({ y: ty, m: tm - 1 })
    setSel(todayKey)
  }

  const dayItems = byDay.get(sel) ?? []

  return (
    <div className="cal-wrap">
      <div className="panel cal">
        <div className="cal-head">
          <h2 className="cal-title">
            {MONTHS[ym.m]} {ym.y}
          </h2>
          <div className="cal-nav">
            <button type="button" className="btn btn-secondary btn-sm" onClick={goToday}>
              Today
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => go(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => go(1)}
              aria-label="Next month"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="cal-grid cal-week" aria-hidden="true">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="cal-grid">
          {cells.map((d, idx) => {
            if (d === null) return <span key={idx} className="cal-cell cal-empty" />
            const key = keyOf(ym.y, ym.m, d)
            const list = byDay.get(key) ?? []
            const open = list.filter((i) => !i.done).length
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSel(key)}
                aria-pressed={sel === key}
                aria-label={`${labelOf(key)}, ${
                  list.length === 0
                    ? 'nothing due'
                    : `${list.length} due${open !== list.length ? `, ${open} open` : ''}`
                }`}
                className={`cal-cell ${sel === key ? 'cal-sel' : ''} ${
                  key === todayKey ? 'cal-today' : ''
                }`}
              >
                <span className="cal-num">{d}</span>
                <span className="cal-chips">
                  {list.slice(0, 2).map((i) => (
                    <span key={i.id} className={`cal-chip cal-${stateOf(i)}`}>
                      {i.title}
                    </span>
                  ))}
                  {list.length > 2 && (
                    <span className="cal-more">+{list.length - 2} more</span>
                  )}
                </span>
                <span className="cal-dots">
                  {list.slice(0, 3).map((i) => (
                    <span key={i.id} className={`cal-dot cal-${stateOf(i)}`} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <section>
        <h2 className="day-h">
          {labelOf(sel)} <span>{dayItems.length}</span>
        </h2>
        {dayItems.length === 0 ? (
          <p className="empty">Nothing due on this day.</p>
        ) : (
          <ul className="panel rows">
            {dayItems.map((i) => (
              <BoardRow key={i.id} a={i} />
            ))}
          </ul>
        )}
      </section>

      {noDue > 0 && (
        <p className="hint">
          {noDue} {noDue === 1 ? 'announcement has' : 'announcements have'} no due
          date. Switch to List to see {noDue === 1 ? 'it' : 'them'}.
        </p>
      )}
    </div>
  )
}
