// src/components/layout/Header.tsx
import { Bell, Search, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function Header() {
  const user = useAuthStore(s => s.user)
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-4 px-5 flex-shrink-0">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9 h-9 text-sm bg-gray-50 border-gray-200 w-full"
            placeholder="Search by patient name..." />
        </div>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <button className="icon-btn relative">
          <Bell size={15}/>
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
            <User size={14} className="text-white"/>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-gray-900">{user?.name ?? 'User'}</div>
            <div className="text-[10px] text-gray-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
