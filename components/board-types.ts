export type BoardItem = {
  id: string
  title: string
  body: string
  due_at: string | null
  created_at: string
  updated_at: string | null
  subject: string | null
  kind: string | null
  author: string | null
  doAt: string | null
  done: boolean
  isNew: boolean
  canEdit: boolean
}
