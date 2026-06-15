// src/pages/chat/ChatPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Plus, Search, MessagesSquare } from 'lucide-react'
import { topnavApi } from '@/api/topnav'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'


function initials(name?: string) {
  return (name ?? '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}


export default function ChatPage() {
  const qc = useQueryClient()
  const me = useAuthStore(s => s.user)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: contactsData } = useQuery({
    queryKey: ['chat-contacts', search],
    queryFn:  () => topnavApi.chatContacts(search || undefined).then(r => r.data),
    refetchInterval: 15000,
  })
  const contacts: any[] = contactsData?.data ?? []

  const active = contacts.find(c => c.id === activeId) || null

  const { data: messagesData } = useQuery({
    queryKey: ['chat-messages', activeId],
    queryFn:  () => activeId ? topnavApi.chatMessages(activeId).then(r => r.data) : Promise.resolve({ data: [] }),
    enabled:  !!activeId,
    refetchInterval: 10000,
  })
  const messages: any[] = messagesData?.data ?? []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeId])

  const send = useMutation({
    mutationFn: () => topnavApi.sendMessage(activeId!, draft.trim()),
    onSuccess:  () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['chat-messages', activeId] })
      qc.invalidateQueries({ queryKey: ['chat-contacts'] })
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeId || !draft.trim() || send.isPending) return
    send.mutate()
  }

  return (
    <div className="p-6">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-140px)]">

          {/* ── Sidebar: contacts ── */}
          <aside className="border-r flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold text-gray-800">Chat System</h2>
              <button className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600"
                title="New chat">
                <Plus size={14}/>
              </button>
            </div>
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400"/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="input pl-8 w-full text-xs h-8"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0
                ? <div className="text-center text-gray-400 text-xs py-6">No contacts</div>
                : contacts.map(c => (
                  <button key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn('w-full flex items-center gap-3 px-3 py-3 border-b text-left hover:bg-gray-50',
                      activeId === c.id && 'bg-brand-50')}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
                      {initials(c.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {c.display_name} <span className="text-xs text-gray-500">({c.role})</span>
                        </p>
                        {c.unread > 0 && (
                          <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-brand-500 text-white text-[10px] font-semibold flex items-center justify-center px-1">
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {c.last_from_me && <span className="text-gray-400">You: </span>}
                        {c.last_message || <span className="italic text-gray-400">No messages yet</span>}
                      </p>
                    </div>
                  </button>
                ))
              }
            </div>
          </aside>

          {/* ── Main: messages ── */}
          <main className="flex flex-col bg-gray-50">
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessagesSquare size={48} className="mb-2 opacity-50"/>
                <p className="text-sm">Select Any User To Start Your Chat</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                    {initials(active.display_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{active.display_name}</p>
                    <p className="text-xs text-gray-500">{active.role}</p>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {messages.length === 0
                    ? <p className="text-center text-gray-400 text-xs py-8">No messages yet — say hello!</p>
                    : messages.map(m => (
                      <div key={m.id} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-md px-3 py-2 rounded-lg text-sm shadow-sm',
                          m.mine ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border'
                        )}>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={cn('text-[10px] mt-1', m.mine ? 'text-brand-50' : 'text-gray-400')}>
                            {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <form onSubmit={submit} className="px-4 py-3 border-t bg-white flex items-center gap-2">
                  <input
                    value={draft} onChange={e => setDraft(e.target.value)}
                    placeholder="Write Your Message…"
                    className="input flex-1 rounded-full"
                  />
                  <button type="submit" disabled={!draft.trim() || send.isPending}
                    className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center disabled:opacity-40">
                    <Send size={15}/>
                  </button>
                </form>
              </>
            )}
          </main>
        </div>

        {/* Footer summary */}
        <div className="px-4 py-2 border-t text-xs text-gray-500">
          Signed in as <span className="font-medium">{me?.name ?? 'User'}</span>
        </div>
      </div>
    </div>
  )
}
