// Same frame as the real screens: flat grey bars at their real size, no shimmer.
export default function Loading() {
  return (
    <>
      <div className="topbar" aria-hidden="true">
        <div className="wrap topbar-in">
          <div className="sk" style={{ width: 28, height: 28, borderRadius: 7 }} />
          <div className="sk" style={{ width: 140, height: 16 }} />
        </div>
      </div>
      <main className="wrap page" aria-busy="true" aria-label="Loading">
        <div>
          <div className="sk" style={{ width: 200, height: 30 }} />
          <div className="sk" style={{ width: 280, height: 20, marginTop: 8 }} />
        </div>
        <div className="panel">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                borderTop: i ? '1px solid var(--rule)' : 'none',
              }}
            >
              <div className="sk" style={{ width: '55%', height: 22 }} />
              <div className="sk" style={{ width: '85%', height: 20, marginTop: 6 }} />
              <div className="sk" style={{ width: '30%', height: 18, marginTop: 8 }} />
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
