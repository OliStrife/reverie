import { useEffect, useRef } from 'react'

const DRAG_START = 5
const EDGE = 80
const MAX_SCROLL = 20
const COVERED_TOP = 60
const COVERED_BOTTOM = 120

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

type Drag = {
  from: number
  row: HTMLElement
  startY: number
  pointerY: number
  started: boolean
  rows: HTMLElement[]
  rowHeight: number
  scroller: HTMLElement | null
  startScroll: number
  shifts: number[]
  target: number
  frame: number
}

export function useRowDrag(
  list: React.RefObject<HTMLElement | null>,
  onReorder: ((from: number, to: number) => void) | undefined
): ((event: React.PointerEvent) => void) | undefined {
  const stop = useRef<(() => void) | null>(null)
  const latest = useRef(onReorder)
  useEffect(() => {
    latest.current = onReorder
  })
  useEffect(() => () => stop.current?.(), [])

  if (!onReorder) return undefined

  return (event) => {
    const element = list.current
    const target = event.target as HTMLElement
    if (event.button !== 0 || !element || target.closest('button, input, a')) return
    const row = target.closest<HTMLElement>('.song-row[data-index]')
    if (!row) return
    stop.current?.()

    const state: Drag = {
      from: Number(row.dataset.index),
      row,
      startY: event.clientY,
      pointerY: event.clientY,
      started: false,
      rows: [],
      rowHeight: 0,
      scroller: null,
      startScroll: 0,
      shifts: [],
      target: Number(row.dataset.index),
      frame: 0
    }

    const layout = (): void => {
      const offset =
        state.pointerY - state.startY + ((state.scroller?.scrollTop ?? 0) - state.startScroll)
      state.row.style.translate = `0 ${offset}px`
      const last = state.rows.length - 1
      const to = clamp(state.from + Math.round(offset / state.rowHeight), 0, last)
      state.target = to
      state.rows.forEach((item, index) => {
        if (index === state.from) return
        const shift =
          state.from < index && index <= to
            ? -state.rowHeight
            : to <= index && index < state.from
              ? state.rowHeight
              : 0
        if (state.shifts[index] === shift) return
        state.shifts[index] = shift
        item.style.translate = shift ? `0 ${shift}px` : ''
      })
    }

    const autoScroll = (): void => {
      const scroller = state.scroller
      if (scroller) {
        const box = scroller.getBoundingClientRect()
        const top = box.top + COVERED_TOP + EDGE
        const bottom = box.bottom - COVERED_BOTTOM - EDGE
        const speed =
          state.pointerY < top
            ? -MAX_SCROLL * Math.min(1, (top - state.pointerY) / EDGE)
            : state.pointerY > bottom
              ? MAX_SCROLL * Math.min(1, (state.pointerY - bottom) / EDGE)
              : 0
        if (speed) {
          scroller.scrollTop += speed
          layout()
        }
      }
      state.frame = requestAnimationFrame(autoScroll)
    }

    const begin = (): void => {
      state.started = true
      state.rows = [...element.querySelectorAll<HTMLElement>('.song-row[data-index]')]
      const [first, second] = state.rows
      state.rowHeight = second ? second.offsetTop - first.offsetTop : row.offsetHeight
      state.shifts = state.rows.map(() => 0)
      state.scroller = element.closest<HTMLElement>('.content')
      state.startScroll = state.scroller?.scrollTop ?? 0
      element.classList.add('dragging')
      row.classList.add('lifted')
      state.frame = requestAnimationFrame(autoScroll)
    }

    const onMove = (move: PointerEvent): void => {
      state.pointerY = move.clientY
      if (!state.started) {
        if (Math.abs(move.clientY - state.startY) < DRAG_START) return
        begin()
      }
      layout()
    }
    const onScroll = (): void => {
      if (state.started) layout()
    }

    const cleanUp = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('scroll', onScroll, true)
      cancelAnimationFrame(state.frame)
      stop.current = null
    }

    const drop = (to: number | null): void => {
      cleanUp()
      if (!state.started) return
      const before = row.getBoundingClientRect().top
      element.classList.add('settling')
      element.classList.remove('dragging')
      state.rows.forEach((item) => (item.style.translate = ''))
      if (to !== null && to !== state.from) latest.current?.(state.from, to)
      requestAnimationFrame(() => {
        const after = row.getBoundingClientRect().top
        row.style.translate = `0 ${before - after}px`
        void row.offsetHeight
        element.classList.remove('settling')
        row.classList.remove('lifted')
        row.classList.add('dropping')
        row.style.translate = ''
        const done = (): void => row.classList.remove('dropping')
        row.addEventListener('transitionend', done, { once: true })
        setTimeout(done, 400)
      })
    }
    const onUp = (): void => drop(state.target)
    const onCancel = (): void => drop(null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('scroll', onScroll, true)
    stop.current = () => drop(null)
  }
}
