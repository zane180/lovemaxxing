'use client'
import { useEffect, useRef } from 'react'

export function MagneticCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    let raf: number
    let mx = -200, my = -200
    let dx = -200, dy = -200
    let rx = -200, ry = -200

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY

      // Magnetic pull on data-magnetic elements
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el => {
        const r  = el.getBoundingClientRect()
        const cx = r.left + r.width  / 2
        const cy = r.top  + r.height / 2
        const ex = mx - cx, ey = my - cy
        const d  = Math.hypot(ex, ey)
        if (d < 100) {
          const f = (1 - d / 100) * 0.28
          el.style.transform  = `translate(${-ex * f}px, ${-ey * f}px)`
          el.style.transition = 'transform 0.04s linear'
        } else {
          el.style.transform  = ''
          el.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)'
        }
      })

      // 3-D tilt on data-tilt elements
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el => {
        const r  = el.getBoundingClientRect()
        const cx = r.left + r.width  / 2
        const cy = r.top  + r.height / 2
        const ex = mx - cx, ey = my - cy
        const d  = Math.hypot(ex, ey)
        if (d < 240) {
          const ix =  (ey / 240) * 9
          const iy = (-ex / 240) * 9
          el.style.transform  = `perspective(800px) rotateX(${ix}deg) rotateY(${iy}deg) scale(1.015)`
          el.style.transition = 'transform 0.07s linear'
        } else {
          el.style.transform  = ''
          el.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)'
        }
      })
    }

    const loop = () => {
      dx += (mx - dx) * 0.88
      dy += (my - dy) * 0.88
      rx += (mx - rx) * 0.10
      ry += (my - ry) * 0.10
      if (dotRef.current)
        dotRef.current.style.transform  = `translate(${dx - 5}px, ${dy - 5}px)`
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <style>{`@media (pointer: fine) { html *:not(input):not(textarea):not(select) { cursor: none !important; } }`}</style>
      {/* Inner dot — fast */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none z-[9999] will-change-transform"
        style={{ background: 'rgba(114,47,55,0.8)', mixBlendMode: 'multiply' }}
      />
      {/* Outer ring — slow trailing */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-[9998] will-change-transform"
        style={{ border: '1px solid rgba(114,47,55,0.28)' }}
      />
    </>
  )
}
