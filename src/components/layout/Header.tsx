// src/components/layout/Header.tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Bell, ArrowLeftRight, BedDouble, MessageCircle,
  Calendar, CheckSquare, Languages, User, Menu,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { setupApi } from '@/api/setup'
import { topnavApi } from '@/api/topnav'
import { useHospitalSettings } from '@/hooks/useHospitalSettings'
import { cn } from '@/lib/utils'
import SwitchBranchModal from '@/components/topnav/SwitchBranchModal'
import BedStatusModal    from '@/components/topnav/BedStatusModal'


/** Render a small white "flag chip" for a 2-letter country code.
 *  Regional-indicator emoji don't render on Windows, so we draw a pill instead. */
function FlagChip({
  code, size = 'sm',
}: { code: string | null | undefined; size?: 'sm' | 'md' }) {
  const c = (code || '').toUpperCase().slice(0, 2) || 'WW'
  const dim = size === 'md' ? 'h-6 px-2 text-[11px]' : 'h-5 px-1.5 text-[10px]'
  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-sm bg-white text-gray-800 font-bold tracking-wide leading-none shadow-sm',
      dim
    )}>
      {c}
    </span>
  )
}


function IconButton({
  to, onClick, title, badge, children,
}: { to?: string; onClick?: () => void; title: string; badge?: number; children: React.ReactNode }) {
  const inner = (
    <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 text-white">
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center">
          {badge}
        </span>
      )}
    </span>
  )
  if (to)      return <NavLink to={to} title={title} className="block">{inner}</NavLink>
  if (onClick) return <button type="button" onClick={onClick} title={title} className="block">{inner}</button>
  return <button type="button" title={title} className="block">{inner}</button>
}


function LanguageDropdown() {
  const [open, setOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ['header-languages'],
    queryFn: () => setupApi.listLanguages().then(r => r.data),
  })
  const langs: any[] = (data?.data ?? []).filter((l: any) => l.is_active)
  const active = langs.find((l: any) => l.is_default) ?? langs[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={`Language — ${active?.name ?? '—'}`}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 text-white"
      >
        <FlagChip code={active?.country_code} size="md"/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-full mt-1 bg-white rounded shadow-lg border w-52 z-40 text-sm overflow-hidden">
            {langs.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 flex items-center gap-2">
                <Languages size={14}/> No active languages
              </div>
            ) : langs.map(l => (
              <button key={l.id}
                onClick={() => setOpen(false)}
                className={cn(
                  'w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2',
                  l.is_default && 'bg-brand-50 text-brand-700 font-medium'
                )}>
                <span className="bg-gray-100 rounded-sm"><FlagChip code={l.country_code} size="sm"/></span>
                <span className="flex-1">{l.name}</span>
                {l.is_default && <span className="text-[10px] text-gray-400">Default</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


export default function Header({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const { settings } = useHospitalSettings()
  const [branchOpen, setBranchOpen] = useState(false)
  const [bedOpen,    setBedOpen]    = useState(false)

  // Live counts
  const { data: notif } = useQuery({
    queryKey: ['header-notif-count'],
    queryFn: () => topnavApi.listFeed(50).then(r => r.data),
    refetchInterval: 60000,
  })
  const notifCount = (notif?.data ?? []).length

  const { data: unread } = useQuery({
    queryKey: ['header-chat-unread'],
    queryFn: () => topnavApi.unreadCount().then(r => r.data),
    refetchInterval: 20000,
  })
  const chatUnread = unread?.data?.unread ?? 0

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const q = String(fd.get('q') || '').trim()
    if (q) navigate(`/patients?search=${encodeURIComponent(q)}`)
  }

  return (
    <header className="h-14 bg-gradient-to-r from-brand-600 to-brand-500 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 flex-shrink-0 text-white">
      {/* Hamburger — only visible below lg where the sidebar is a drawer */}
      <button
        type="button"
        onClick={onMenuClick}
        title="Open menu"
        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/20 text-white flex-shrink-0"
      >
        <Menu size={20}/>
      </button>

      {/* Search — hidden on very small phones; full size from sm: up */}
      <form onSubmit={handleSearch} className="hidden sm:block w-48 md:w-64 lg:w-72 max-w-md">
        <div className="relative">
          <input
            name="q"
            className="w-full h-9 pl-4 pr-10 text-sm rounded-full bg-white text-gray-700 placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Search By Patient Name"
          />
          <button title="Search" type="submit"
            className="absolute right-1 top-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700">
            <Search size={13}/>
          </button>
        </div>
      </form>

      <h1 className="text-base sm:text-lg font-semibold text-white truncate flex-1 min-w-0">
        {settings.hospital_name || ''}
      </h1>

      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        <span className="hidden sm:inline-flex"><LanguageDropdown/></span>
        <span className="hidden lg:inline-flex">
          <IconButton onClick={() => setBranchOpen(true)} title="Switch Branch">
            <ArrowLeftRight size={17}/>
          </IconButton>
        </span>
        <IconButton to="/notifications" title="Notifications" badge={notifCount > 99 ? 99 : notifCount}>
          <Bell size={17}/>
        </IconButton>
        <span className="hidden md:inline-flex">
          <IconButton onClick={() => setBedOpen(true)} title="Bed Status">
            <BedDouble size={17}/>
          </IconButton>
        </span>
        <IconButton to="/chat" title="Chat" badge={chatUnread > 99 ? 99 : chatUnread}>
          <MessageCircle size={17}/>
        </IconButton>
        <span className="hidden lg:inline-flex">
          <IconButton to="/calendar" title="Calendar">
            <Calendar size={17}/>
          </IconButton>
        </span>
        <span className="hidden lg:inline-flex">
          <IconButton to="/calendar" title="Task">
            <CheckSquare size={17}/>
          </IconButton>
        </span>

        <div className="ml-1 sm:ml-2 sm:pl-2 sm:border-l sm:border-white/30 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User size={14} className="text-white"/>
          </div>
          <div className="hidden md:block leading-tight">
            <div className="text-xs font-medium">{user?.name ?? 'User'}</div>
            <div className="text-[10px] capitalize opacity-80">{user?.role}</div>
          </div>
        </div>
      </div>

      <SwitchBranchModal open={branchOpen} onClose={() => setBranchOpen(false)}/>
      <BedStatusModal    open={bedOpen}    onClose={() => setBedOpen(false)}/>
    </header>
  )
}
