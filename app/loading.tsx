export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4" aria-busy="true">
      <div className="space-y-2 py-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-muted/40"
          />
        ))}
      </div>
    </main>
  )
}
