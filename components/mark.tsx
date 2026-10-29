// The CSB mark: a pinned notice. Flat teal square, a folded corner, two lines of text.
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="28" height="28" rx="7" fill="#0b6b61" />
      <path d="M8 7h8.5L20 10.5V21H8z" fill="#fff" />
      <path d="M16.5 7v3.5H20z" fill="#9fd3cb" />
      <rect x="10.5" y="13" width="7" height="1.6" rx="0.8" fill="#0b6b61" />
      <rect x="10.5" y="16.4" width="4.5" height="1.6" rx="0.8" fill="#0b6b61" />
    </svg>
  )
}
