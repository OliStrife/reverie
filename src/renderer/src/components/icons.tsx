function Icon({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function WaveIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />
    </Icon>
  )
}

export function HomeIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" />
    </Icon>
  )
}

export function MoreIcon(): React.JSX.Element {
  return (
    <Icon>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </Icon>
  )
}

export function CheckIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function SearchIcon(): React.JSX.Element {
  return (
    <Icon>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </Icon>
  )
}

export function ImageIcon(): React.JSX.Element {
  return (
    <Icon>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M20.5 15.5l-4.5-4.5-8 8" />
    </Icon>
  )
}

export function PencilIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z" />
      <path d="M14 7l3 3" />
    </Icon>
  )
}

export function ListAddIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 6h12M4 12h8M4 18h8M18 13v8M14 17h8" />
    </Icon>
  )
}

export function MinusIcon(): React.JSX.Element {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12h7" />
    </Icon>
  )
}

export function MusicIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </Icon>
  )
}

export function TabChevronIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 12 32"
      width="0.5em"
      height="1.33em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 6L3.5 16l5 10" />
    </svg>
  )
}

export function ChevronDownIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  )
}

export function SettingsIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </Icon>
  )
}

export function FolderIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
    </Icon>
  )
}

export function ChevronLeftIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M14.5 6l-6 6 6 6" />
    </Icon>
  )
}

export function CloseIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

export function AddIcon(): React.JSX.Element {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </Icon>
  )
}

export function AddedIcon(): React.JSX.Element {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
      <path className="added-check" d="M8.3 12.4l2.5 2.5 4.9-5.4" />
    </Icon>
  )
}

export function LyricsIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 6h11M4 10.5h11M4 15h6" />
      <path d="M17.5 19.5a2 2 0 1 1 0-.01V9.5l3-1.5" />
    </Icon>
  )
}

export function ClockIcon(): React.JSX.Element {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  )
}

export function PlusIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function OpenIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </Icon>
  )
}

export function TrashIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6 7l1 11.5A2 2 0 0 0 9 20.5h6a2 2 0 0 0 2-2L18 7" />
    </Icon>
  )
}

export function PlayIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </Icon>
  )
}

export function PauseIcon(): React.JSX.Element {
  return (
    <Icon>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function RepeatOneIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M17 3l3 3-3 3" />
      <path d="M4 11v-1a4 4 0 0 1 4-4h12" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M20 13v1a4 4 0 0 1-4 4H4" />
      <path d="M11 10.5l1.5-1v5.5" strokeWidth="1.8" />
    </Icon>
  )
}

export function PrevIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M18 6.5v11l-8.5-5.5z" fill="currentColor" />
      <path d="M6.5 6v12" />
    </Icon>
  )
}

export function NextIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M6 6.5v11l8.5-5.5z" fill="currentColor" />
      <path d="M17.5 6v12" />
    </Icon>
  )
}

export function ShuffleIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M3 17h2.5a4 4 0 0 0 3.3-1.8l4.4-6.4A4 4 0 0 1 16.5 7H21" />
      <path d="M3 7h2.5a4 4 0 0 1 3 1.4M21 17h-4.5a4 4 0 0 1-3-1.4" />
      <path d="M18 4l3 3-3 3M18 14l3 3-3 3" />
    </Icon>
  )
}

export function RepeatIcon(): React.JSX.Element {
  return (
    <Icon>
      <path d="M17 3l3 3-3 3" />
      <path d="M4 11v-1a4 4 0 0 1 4-4h12" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M20 13v1a4 4 0 0 1-4 4H4" />
    </Icon>
  )
}

export function VolumeIcon({ muted }: { muted: boolean }): React.JSX.Element {
  return (
    <Icon>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      ) : (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )}
    </Icon>
  )
}
