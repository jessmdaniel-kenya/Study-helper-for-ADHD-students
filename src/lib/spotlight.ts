const SURFACES = '.card, .resource-card, .energy-choice, .blueprint-card, .collection-item, .material-card'

/**
 * Feeds the pointer position into --mx/--my on whichever card is under the
 * cursor, for the CSS spotlight in index.css. One passive listener, rAF-batched.
 */
export function startSpotlight() {
  let frame = 0
  let last: PointerEvent | null = null

  const paint = () => {
    frame = 0
    if (!last || document.body.classList.contains('calm')) return
    const target = (last.target as Element | null)?.closest?.(SURFACES) as HTMLElement | null
    if (!target) return
    const rect = target.getBoundingClientRect()
    target.style.setProperty('--mx', `${last.clientX - rect.left}px`)
    target.style.setProperty('--my', `${last.clientY - rect.top}px`)
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return
      last = event
      frame ||= requestAnimationFrame(paint)
    },
    { passive: true },
  )
}
