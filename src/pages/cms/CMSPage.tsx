// src/pages/cms/CMSPage.tsx
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Edit2, Trash2, ChevronDown,
  Image as ImageIcon, Menu as MenuIcon, FileText, UploadCloud,
} from 'lucide-react'
import api from '@/lib/axios'
import { cmsApi } from '@/api/cms'
import AddPageModal       from './AddPageModal'
import AddMenuModal       from './AddMenuModal'
import MediaManagerModal  from './MediaManagerModal'
import { cn } from '@/lib/utils'

type View = 'pages' | 'media' | 'menus' | 'banners'

function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (api.defaults?.baseURL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/,'')
  return `${base}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`
}


export default function CMSPage() {
  const qc = useQueryClient()
  const [view, setView] = useState<View>('pages')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen]   = useState<{ open: boolean; defaultType?: any; page?: any }>({ open: false })
  const [menuModal, setMenuModal] = useState<{ open: boolean; group?: any }>({ open: false })
  const [mediaOpen, setMediaOpen] = useState(false)
  const [addPageMenuOpen, setAddPageMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})
  const bannerFileRef = useRef<HTMLInputElement>(null)

  // ── data ──
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['cms-pages', search],
    queryFn:  () => cmsApi.listPages({ search, per_page: 200 }).then(r => r.data),
    enabled:  view === 'pages',
  })
  const { data: menusData } = useQuery({
    queryKey: ['cms-menus'],
    queryFn:  () => cmsApi.listMenus().then(r => r.data),
    enabled:  view === 'menus',
  })
  const { data: menuItemsData } = useQuery({
    queryKey: ['cms-menu-items'],
    queryFn:  () => cmsApi.listMenuItems().then(r => r.data),
    enabled:  view === 'menus',
  })
  const { data: bannersData } = useQuery({
    queryKey: ['cms-banners'],
    queryFn:  () => cmsApi.listBanners().then(r => r.data),
    enabled:  view === 'banners',
  })

  const pages:    any[] = pagesData?.data    ?? []
  const menus:    any[] = menusData?.data    ?? []
  const items:    any[] = menuItemsData?.data ?? []
  const banners:  any[] = bannersData?.data  ?? []

  // ── mutations ──
  const delPage = useMutation({
    mutationFn: (id: number) => cmsApi.deletePage(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cms-pages'] }),
  })
  const delMenu = useMutation({
    mutationFn: (id: number) => cmsApi.deleteMenu(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cms-menus'] }),
  })
  const delBanner = useMutation({
    mutationFn: (id: number) => cmsApi.deleteBanner(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cms-banners'] }),
  })
  const uploadBanner = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData(); fd.append('file', f)
      return cmsApi.uploadBanner(fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-banners'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Front CMS</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pages, media, navigation and banners</p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'pages' && (
            <div className="relative flex">
              <button
                onClick={() => setAddOpen({ open: true })}
                className="btn btn-primary rounded-r-none px-3"
              >
                Add Page
              </button>
              <button
                onClick={() => setAddPageMenuOpen(o => !o)}
                className="btn btn-primary rounded-l-none border-l border-white/30 px-2"
              >
                <ChevronDown size={14}/>
              </button>
              {addPageMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-md z-10 w-40">
                  {[
                    ['Events', 'Add Event'],
                    ['Gallery','Add Gallery'],
                    ['Notice', 'Add News'],
                  ].map(([t, label]) => (
                    <button
                      key={t} type="button"
                      onClick={() => { setAddOpen({ open: true, defaultType: t }); setAddPageMenuOpen(false) }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={() => { setMediaOpen(true) }} className={cn('btn flex items-center gap-1.5', view === 'media' ? 'btn-primary' : 'btn-outline')}>
            <ImageIcon size={14}/> Media Manager
          </button>
          <button onClick={() => setView('menus')}    className={cn('btn flex items-center gap-1.5', view === 'menus'   ? 'btn-primary' : 'btn-outline')}>
            <MenuIcon size={14}/> Menus
          </button>
          <button onClick={() => setView('banners')}  className={cn('btn flex items-center gap-1.5', view === 'banners' ? 'btn-primary' : 'btn-outline')}>
            <ImageIcon size={14}/> Banners
          </button>
          {view !== 'pages' && (
            <button onClick={() => setView('pages')} className="btn btn-outline flex items-center gap-1.5">
              <FileText size={14}/> Pages
            </button>
          )}
        </div>
      </div>

      {/* PAGES */}
      {view === 'pages' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Page List</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="input pl-8 w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Page Type</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagesLoading ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
                ) : pages.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No pages yet</td></tr>
                ) : pages.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{p.title}</td>
                    <td className="px-3 py-2 text-emerald-600 truncate max-w-md" title={p.url}>{p.url}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{p.page_type}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setAddOpen({ open: true, page: p })} className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                        <button onClick={() => { if (confirm('Delete this page?')) delPage.mutate(p.id) }} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MENUS */}
      {view === 'menus' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Menu List</h3>
            <button onClick={() => setMenuModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Add Menu
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {menus.length === 0 ? (
                <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">No menus yet</td></tr>
              ) : menus.map(g => {
                const groupItems = items.filter(i => i.menu_group_id === g.id)
                const expanded = !!expandedGroups[g.id]
                return (
                  <>
                    <tr key={g.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setExpandedGroups(s => ({ ...s, [g.id]: !s[g.id] }))}
                          className="text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          {expanded ? <ChevronDown size={12}/> : <Plus size={12}/>}
                          {g.name}
                          <span className="text-[10px] text-gray-400 ml-1">({groupItems.length})</span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setMenuModal({ open: true, group: g })} className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                          <button onClick={() => { if (confirm('Delete this menu group?')) delMenu.mutate(g.id) }} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                    {expanded && groupItems.length > 0 && (
                      <tr>
                        <td colSpan={2} className="bg-gray-50 px-3 py-2">
                          <ul className="ml-6 list-disc text-xs space-y-1">
                            {groupItems.map(i => (
                              <li key={i.id}>{i.name} <span className="text-gray-400">— {i.url || '/'}</span></li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BANNERS */}
      {view === 'banners' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Banner Images</h3>
            <input
              ref={bannerFileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadBanner.mutate(f) }}
            />
            <button onClick={() => bannerFileRef.current?.click()} className="btn btn-primary flex items-center gap-1.5">
              <UploadCloud size={14}/> Add Images
            </button>
          </div>
          <div className="p-5">
            {banners.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No banners yet</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {banners.map(b => (
                  <div key={b.id} className="border rounded overflow-hidden group">
                    <div className="aspect-[4/2] bg-gray-100">
                      {b.image_url && (
                        <img
                          src={assetUrl(b.image_url) ?? ''}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2 flex items-center justify-between gap-1">
                      <span className="text-xs text-emerald-600 truncate" title={b.title}>{b.title}</span>
                      <button
                        onClick={() => { if (confirm('Delete this banner?')) delBanner.mutate(b.id) }}
                        className="p-0.5 hover:bg-red-50 rounded text-red-500"
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AddPageModal
        open={addOpen.open}
        page={addOpen.page}
        defaultType={addOpen.defaultType}
        onClose={() => setAddOpen({ open: false })}
      />
      <AddMenuModal
        open={menuModal.open}
        group={menuModal.group}
        onClose={() => setMenuModal({ open: false })}
      />
      <MediaManagerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
      />
    </div>
  )
}
