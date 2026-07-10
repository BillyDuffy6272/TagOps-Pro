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
      <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-4">
        <svg width="22" height="22" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="#e6e7eb" />
          <path d="M8 12.5 23.5 28M12.5 8 28 23.5M7.5 19.5 16.5 28.5" stroke="#08090a" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-text-primary">TagOps Pro</div>
          <div className="truncate text-[11.5px] font-medium text-text-faint">Tracking workspace</div>
        </div>
        <svg className="ml-auto text-text-faint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pt-2" aria-label="Main navigation">
        <div className="px-2 pb-1 text-[11px] font-semibold tracking-[0.08em] text-text-faint uppercase">
          Workspace
        </div>
        {NAV_ITEMS.map(item => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? 'bg-white/9 text-text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)]'
                  : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
              }`}
              onClick={() => setActiveView(item.id)}
            >
              {isActive && <span className="absolute top-3 bottom-3 left-0 w-0.5 rounded-r-full bg-accent" aria-hidden="true" />}
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 [&_svg]:h-[18px] [&_svg]:w-[18px] ${
                  isActive
                    ? 'border-accent/20 bg-accent-muted text-accent'
                    : 'border-border-subtle bg-surface text-text-faint group-hover:border-border group-hover:text-text-secondary'
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold leading-5 text-current">{item.label}</span>
                <span className={`block truncate text-[12px] font-medium leading-4 ${isActive ? 'text-text-secondary' : 'text-text-faint group-hover:text-text-tertiary'}`}>
                  {item.description}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle px-3 pt-3 pb-3">
        <div className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full ring-1 ring-white/15" />
            : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[12px] font-semibold text-text-secondary ring-1 ring-white/10" aria-hidden="true">
                {userName.charAt(0).toUpperCase()}
              </div>
            )
          }
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-text-secondary" title={userName}>{userName}</div>
            <div className="truncate text-[11.5px] font-medium text-text-faint">Signed in</div>
          </div>
        </div>
        <button
          type="button"
          className="w-full rounded-md px-2 py-2 text-left text-[12.5px] font-medium text-text-tertiary transition-colors duration-150 ease-out hover:bg-white/5 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
