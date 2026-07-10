import type { ActiveView } from './AppShell'
import { NAV_ITEMS } from './navItems'

interface Props {
  activeView: ActiveView
}

export default function TopBar({ activeView }: Props) {
  const item = NAV_ITEMS.find(n => n.id === activeView)
  if (!item) return null

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle bg-canvas/95 px-6">
      <span className="flex h-4 w-4 items-center justify-center text-text-faint" aria-hidden="true">{item.icon}</span>
      <span className="text-[13.5px] font-semibold text-text-secondary">{item.label}</span>
      <span className="ml-auto hidden rounded-md border border-border-subtle bg-surface px-2 py-1 font-mono text-[11px] text-text-faint md:inline-flex">
        Workspace
      </span>
    </header>
  )
}
