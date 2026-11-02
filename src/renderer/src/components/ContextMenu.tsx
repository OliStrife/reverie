import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon } from './icons'

export type MenuItem =
  | {
      label: string
      icon?: React.JSX.Element
      checked?: boolean
      danger?: boolean
      onSelect: () => void
    }
  | { heading: string }
  | { separator: true }

type Props = {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

const EDGE = 8

function ContextMenu({ x, y, items, onClose }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const menu = ref.current?.getBoundingClientRect()
    if (!menu) return
    setPosition({
      left: x + menu.width > innerWidth - EDGE ? Math.max(EDGE, x - menu.width) : x,
      top: y + menu.height > innerHeight - EDGE ? Math.max(EDGE, y - menu.height) : y
    })
  }, [x, y])

  useEffect(() => {
    const close = (event: Event): void => {
      if (event instanceof MouseEvent && ref.current?.contains(event.target as Node)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('blur', close)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('blur', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className="context-menu glass-card"
      role="menu"
      data-no-swipe
      style={position}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) => {
        if ('separator' in item) return <div key={index} className="menu-separator" />
        if ('heading' in item) {
          return (
            <p key={index} className="menu-heading">
              {item.heading}
            </p>
          )
        }
        return (
          <button
            key={index}
            type="button"
            role="menuitem"
            className={`menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              onClose()
              item.onSelect()
            }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            {item.checked && <CheckIcon />}
          </button>
        )
      })}
    </div>,
    document.body
  )
}

export default ContextMenu
