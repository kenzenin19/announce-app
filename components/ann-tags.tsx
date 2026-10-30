// Small neutral tags for the subject and type. "None" shows nothing.
export function AnnTags({
  subject,
  kind,
}: {
  subject?: string | null
  kind?: string | null
}) {
  const tags = [subject, kind].filter((t): t is string => !!t && t !== 'None')
  if (tags.length === 0) return null
  return (
    <span className="tags">
      {tags.map((t) => (
        <span key={t} className="tag">
          {t}
        </span>
      ))}
    </span>
  )
}
