// Runs once in the browser when the app starts (Next.js 15.3 and newer).
// 1) Registers the service worker.
// 2) Shows our own "Install app" popup.
//    - Android / desktop Chrome: real Install button
//    - iPhone / iPad: short "Add to Home Screen" instructions

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'install-popup-dismissed-at'
const DISMISS_DAYS = 7
const SHOW_AFTER_MS = 3000

let deferred: InstallEvent | null = null
let scheduled = false

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // storage blocked: popup may show again next visit, that's fine
  }
}

function removePopup() {
  document.getElementById('install-popup')?.remove()
}

function showPopup(mode: 'prompt' | 'ios') {
  if (!document.body || document.getElementById('install-popup')) return
  if (isStandalone()) return

  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const fg = dark ? '#f9fafb' : '#111827'
  const bg = dark ? '#1f2937' : '#ffffff'
  const border = dark ? '#374151' : '#e5e7eb'
  const muted = dark ? '#d1d5db' : '#4b5563'

  const box = document.createElement('div')
  box.id = 'install-popup'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-label', 'Install app')
  Object.assign(box.style, {
    position: 'fixed',
    left: '12px',
    right: '12px',
    bottom: '12px',
    maxWidth: '420px',
    margin: '0 auto',
    zIndex: '9999',
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,.2)',
    padding: '14px',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    fontSize: '14px',
    lineHeight: '1.4',
  } as Partial<CSSStyleDeclaration>)

  const title = document.createElement('div')
  title.textContent = 'Install CSB Announcements'
  Object.assign(title.style, { fontWeight: '600', marginBottom: '4px' })

  const text = document.createElement('div')
  text.style.color = muted
  text.textContent =
    mode === 'ios'
      ? 'Tap the Share button in Safari, then choose "Add to Home Screen". You need this to get notifications on iPhone.'
      : 'Add it to your home screen for quick access and notifications.'

  const row = document.createElement('div')
  Object.assign(row.style, {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    justifyContent: 'flex-end',
  })

  const later = document.createElement('button')
  later.type = 'button'
  later.textContent = mode === 'ios' ? 'Got it' : 'Not now'
  Object.assign(later.style, {
    padding: '8px 14px',
    borderRadius: '8px',
    border: `1px solid ${border}`,
    background: 'transparent',
    color: fg,
    fontSize: '14px',
    cursor: 'pointer',
  })
  later.addEventListener('click', () => {
    rememberDismissed()
    removePopup()
  })
  row.appendChild(later)

  if (mode === 'prompt') {
    const install = document.createElement('button')
    install.type = 'button'
    install.textContent = 'Install'
    Object.assign(install.style, {
      padding: '8px 16px',
      borderRadius: '8px',
      border: '0',
      background: '#4f46e5',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    })
    install.addEventListener('click', async () => {
      if (!deferred) return
      const ev = deferred
      deferred = null
      removePopup()
      await ev.prompt()
      const choice = await ev.userChoice
      if (choice.outcome === 'dismissed') rememberDismissed()
    })
    row.appendChild(install)
  }

  box.append(title, text, row)
  document.body.appendChild(box)
}

function schedule(mode: 'prompt' | 'ios') {
  if (scheduled || isStandalone() || recentlyDismissed()) return
  scheduled = true
  setTimeout(() => showPopup(mode), SHOW_AFTER_MS)
}

if (typeof window !== 'undefined') {
  // 1) Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // not fatal: the app still works without it
      })
    })
  }

  // 2) Install popup (Android / desktop)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallEvent
    schedule('prompt')
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    removePopup()
  })

  // 3) Install help (iPhone / iPad)
  if (isIos() && !isStandalone()) schedule('ios')
}
