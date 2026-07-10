import type { Session } from '@supabase/supabase-js'
import type { ActiveView } from './AppShell'
import { supabase } from '../lib/supabase'
import { NAV_ITEMS } from './navItems'

interface Props {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  session: Session
}

export default function Sidebar({ activeView, setActiveView, session }: Props) {
  const user = session.user
  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'User'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <aside className="flex h-screen flex-col overflow-hidden bg-surface-sunken">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-3">
        <svg width="19" height="19" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="#e6e7eb" />
          <path d="M8 12.5 23.5 28M12.5 8 28 23.5M7.5 19.5 16.5 28.5" stroke="#08090a" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="text-[14px] font-semibold text-text-primary">TagOps Pro</span>
        <svg className="ml-auto text-text-faint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pt-1" aria-label="Main navigation">
        {NAV_ITEMS.map(item => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13.5px] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? 'bg-white/9 font-medium text-text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)]'
                  : 'font-medium text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
              }`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-text-faint" aria-hidden="true">{item.icon}</span>
              <span className="leading-none whitespace-nowrap">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle px-3 pt-3 pb-3">
        <div className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/15" />
            : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[10px] font-semibold text-text-secondary ring-1 ring-white/10" aria-hidden="true">
                {userName.charAt(0).toUpperCase()}
              </div>
            )
          }
          <span className="min-w-0 overflow-hidden text-[12.5px] font-medium text-ellipsis whitespace-nowrap text-text-secondary" title={userName}>{userName}</span>
        </div>
        <button
          type="button"
          className="w-full rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:bg-white/5 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
