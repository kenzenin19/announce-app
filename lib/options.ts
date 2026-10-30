// The choices on the New announcement form. Keep these in sync with the
// check constraints in supabase/day7-subjects-reminders.sql.
export const SUBJECTS = [
  'None',
  'ODE',
  'DS2',
  'DSA',
  'INTRO2AI',
  'OS',
  'OOP',
  'PATHFIT',
  'ARTAPP',
  'STS',
] as const

export const KINDS = [
  'None',
  'Quiz',
  'LT',
  'Exam',
  'Proj',
  'Coding',
  'Activity',
  'Todo',
] as const

export type Subject = (typeof SUBJECTS)[number]
export type Kind = (typeof KINDS)[number]
