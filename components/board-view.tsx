'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, List, Plus } from 'lucide-react'
import { BoardRow } from '@/components/board-row'
import { DueCalendar } from '@/components/due-calendar'
import type { BoardItem } from '@/components/board-types'
import { KINDS, SUBJECTS } from '@/lib/options'

type View = 'list' | 'calendar'
type Sort = 'due' | 'subject' | 'kind'

const VIEW_KEY = 'board-view'
const SORT_KEY = 'board-sort'
const SUBJECT_KEY = 'board-subject'
const KIND_KEY = 'board-kind'
const ALL = 'All'

// Groups keep the soonest-due-first order inside each group.
function group(items: BoardItem[], sort: Sort) {
  if (sort === 'due') return [{ label: null as string | null, items }]

  const order = sort === 'subject' ? SUBJECTS : KINDS
  const pick = (i: BoardItem) => (sort === 'subject' ? i.subject : i.kind) ?? 'None'
  const names = [...order.filter((n) => n !== 'None'), 'None']

  return names
    .map((n) => ({
      label:
        n === 'None' ? (sort === 'subject' ? 'No subject' : 'No type') : n,
      items: items.filter((i) => pick(i) === n),
    }))
    .filter((g) => g.items.length > 0)
}

export function BoardView({
  items,
  finding,
  canPost,
  notices,
}: {
  items: BoardItem[]
  finding: string
  canPost: boolean
  notices?: React.ReactNode
}) {
  const [view, setView] = useState<View>('list')
  const [sort, setSort] = useState<Sort>('due')
  const [subjectPick, setSubjectPick] = useState<string>(ALL)
  const [kindPick, setKindPick] = useState<string>(ALL)

  // Remember the choice on this device
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY)
      const s = localStorage.getItem(SORT_KEY)
      if (v === 'list' || v === 'calendar') setView(v)
      if (s === 'due' || s === 'subject' || s === 'kind') setSort(s)
      const sp = localStorage.getItem(SUBJECT_KEY)
      const kp = localStorage.getItem(KIND_KEY)
      if (sp && (sp === ALL || (SUBJECTS as readonly string[]).includes(sp))) setSubjectPick(sp)
      if (kp && (kp === ALL || (KINDS as readonly string[]).includes(kp))) setKindPick(kp)
    } catch {
      // storage blocked: defaults are fine
    }
  }, [])

  function pickView(v: View) {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // ignore
    }
  }
  function pickSort(s: Sort) {
    setSort(s)
    try {
      localStorage.setItem(SORT_KEY, s)
    } catch {
      // ignore
    }
  }

  function pickSubject(v: string) {
    setSubjectPick(v)
    try {
      localStorage.setItem(SUBJECT_KEY, v)
    } catch {
      // ignore
    }
  }
  function pickKind(v: string) {
    setKindPick(v)
    try {
      localStorage.setItem(KIND_KEY, v)
    } catch {
      // ignore
    }
  }

  // The chosen subject or type narrows both the list and the calendar
  const pick = sort === 'subject' ? subjectPick : sort === 'kind' ? kindPick : ALL
  const field = (i: BoardItem) =>
    (sort === 'subject' ? i.subject : i.kind) ?? 'None'
  const shown = pick === ALL ? items : items.filter((i) => field(i) === pick)

  const open = shown.filter((i) => !i.done)
  const done = shown.filter((i) => i.done)
  // With one subject/type picked there is nothing to group
  const groups = group(open, pick === ALL ? sort : 'due')

  const choices =
    sort === 'subject' ? SUBJECTS : sort === 'kind' ? KINDS : null
  const noneLabel = sort === 'subject' ? 'No subject' : 'No type'
  const countOf = (name: string) =>
    items.filter((i) => !i.done && field(i) === name).length

  return (
    <>
      <div>
        <div className="titlerow">
          <h1 className="title">Due dates</h1>
          <div className="titlerow-actions">
            <div className="seg" role="group" aria-label="View">
              <button
                type="button"
                aria-pressed={view === 'list'}
                onClick={() => pickView('list')}
              >
                <List size={16} aria-hidden="true" />
                List
              </button>
              <button
                type="button"
                aria-pressed={view === 'calendar'}
                onClick={() => pickView('calendar')}
              >
                <CalendarDays size={16} aria-hidden="true" />
                Calendar
              </button>
            </div>
            {canPost && (
              <Link
                href="/announcements/new"
                className="btn btn-primary hide-phone"
              >
                <Plus size={16} strokeWidth={2} aria-hidden="true" />
                New announcement
              </Link>
            )}
          </div>
        </div>
        {finding && <p className="sub sub-line">{finding}</p>}
      </div>

      {notices}

      {items.length === 0 && (
        <p className="empty">
          No announcements yet.
          {canPost ? ' Post the first one with New announcement.' : ''}
        </p>
      )}

      {items.length > 0 && (
        <div className="sortwrap">
          <div className="sortbar">
            <span className="sortbar-label">
              {view === 'list' ? 'Sort by' : 'Filter by'}
            </span>
            <div className="seg" role="group" aria-label="Sort by">
              <button
                type="button"
                aria-pressed={sort === 'due'}
                onClick={() => pickSort('due')}
              >
                Due date
              </button>
              <button
                type="button"
                aria-pressed={sort === 'subject'}
                onClick={() => pickSort('subject')}
              >
                Subject
              </button>
              <button
                type="button"
                aria-pressed={sort === 'kind'}
                onClick={() => pickSort('kind')}
              >
                Type
              </button>
            </div>
          </div>

          {choices && (
            <div
              className="chips"
              role="group"
              aria-label={sort === 'subject' ? 'Pick a subject' : 'Pick a type'}
            >
              {[ALL, ...choices.filter((c) => c !== 'None'), 'None'].map((c) => {
                const active = pick === c
                const n = c === ALL ? items.filter((i) => !i.done).length : countOf(c)
                const set = sort === 'subject' ? pickSubject : pickKind
                return (
                  <button
                    key={c}
                    type="button"
                    className={`chip ${n === 0 && !active ? 'chip-zero' : ''}`}
                    aria-pressed={active}
                    onClick={() => set(c)}
                  >
                    {c === 'None' ? noneLabel : c}
                    <span>{n}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && items.length > 0 && <DueCalendar items={shown} />}

      {view === 'list' && items.length > 0 && (
        <>
          {open.length === 0 && (
            <p className="empty">Nothing open. Everything is marked done.</p>
          )}

          {groups.map((g) => (
            <section key={g.label ?? 'all'}>
              {g.label && (
                <h2 className="day-h">
                  {g.label} <span>{g.items.length}</span>
                </h2>
              )}
              <ul className="panel rows">
                {g.items.map((a) => (
                  <BoardRow key={a.id} a={a} />
                ))}
              </ul>
            </section>
          ))}

          {done.length > 0 && (
            <details className="donegroup">
              <summary>
                Done <span>{done.length}</span>
              </summary>
              <ul className="panel rows">
                {done.map((a) => (
                  <BoardRow key={a.id} a={a} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </>
  )
}
