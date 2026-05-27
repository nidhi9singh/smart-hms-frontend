// src/pages/cms/AddPageModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, FolderOpen, Trash2 } from 'lucide-react'
import { cmsApi } from '@/api/cms'

const PAGE_TYPES = ['Standard', 'Events', 'Notice', 'Gallery'] as const

type Props = {
  open: boolean
  onClose: () => void
  page?: any
  defaultType?: typeof PAGE_TYPES[number]
}


export default function AddPageModal({ open, onClose, page, defaultType }: Props) {
  const qc = useQueryClient()
  const editing = !!page?.id
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    page_type: 'Standard',
    content: '',
    featured_image: '' as string | null | '',
    has_sidebar: false,
    event_date: '',
    meta_title: '',
    meta_desc: '',
  })
  const [seoOpen, setSeoOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        title          : page?.title ?? '',
        page_type      : page?.page_type ?? defaultType ?? 'Standard',
        content        : page?.content ?? '',
        featured_image : page?.featured_image ?? '',
        has_sidebar    : !!page?.has_sidebar,
        event_date     : page?.event_date ?? '',
        meta_title     : page?.meta_title ?? '',
        meta_desc      : page?.meta_desc ?? '',
      })
      setSeoOpen(false)
    }
  }, [open, page, defaultType])

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing ? cmsApi.updatePage(page.id, payload) : cmsApi.addPage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] })
      onClose()
    },
  })

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await cmsApi.uploadFeatured(fd)
      setForm(f => ({ ...f, featured_image: res.data?.data?.path ?? '' }))
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    save.mutate({
      title          : form.title.trim(),
      page_type      : form.page_type,
      content        : form.content,
      featured_image : form.featured_image || null,
      has_sidebar    : form.has_sidebar,
      event_date     : form.event_date || null,
      meta_title     : form.meta_title || null,
      meta_desc      : form.meta_desc || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-6 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[1080px] max-w-[96vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            {editing ? 'Edit Page' : 'Add Page'}
          </h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-3 gap-5">
            {/* Main column */}
            <div className="col-span-2 space-y-4">
              <div className="card p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-600 mb-1">Page Type</span>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {PAGE_TYPES.map(t => (
                      <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio" name="page_type" value={t}
                          checked={form.page_type === t}
                          onChange={() => setForm({ ...form, page_type: t })}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                {form.page_type === 'Events' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                    <input
                      type="date" value={form.event_date}
                      onChange={e => setForm({ ...form, event_date: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                )}
              </div>

              <div className="card p-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="input w-full font-mono text-xs" rows={14}
                  placeholder="HTML / rich text body..."
                />
              </div>

              <div className="card">
                <button
                  type="button"
                  onClick={() => setSeoOpen(o => !o)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700"
                >
                  <span>SEO Detail</span>
                  <span className="text-lg">{seoOpen ? '−' : '+'}</span>
                </button>
                {seoOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                      <input
                        type="text" value={form.meta_title}
                        onChange={e => setForm({ ...form, meta_title: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                      <textarea
                        value={form.meta_desc}
                        onChange={e => setForm({ ...form, meta_desc: e.target.value })}
                        className="input w-full" rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar column */}
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Sidebar Setting</h3>
                <label className="flex items-center justify-between text-sm">
                  <span>Sidebar</span>
                  <input
                    type="checkbox" checked={form.has_sidebar}
                    onChange={e => setForm({ ...form, has_sidebar: e.target.checked })}
                    className="rounded"
                  />
                </label>
              </div>

              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Featured Image</h3>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
                />
                <div className="flex items-center gap-2">
                  <input
                    readOnly value={form.featured_image || ''}
                    placeholder="Select Image"
                    className="input flex-1 text-xs"
                  />
                  <button type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-1.5 border rounded hover:bg-gray-50"
                  >
                    <FolderOpen size={14}/>
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, featured_image: '' }))}
                    className="p-1.5 border rounded hover:bg-red-50 text-red-500"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
                {uploading && <p className="text-xs text-gray-500 mt-2">Uploading…</p>}
                {form.featured_image && (
                  <p className="text-[10px] text-gray-400 mt-2 truncate">{form.featured_image}</p>
                )}
              </div>

              <button
                type="submit" disabled={save.isPending}
                className="btn btn-primary w-full"
              >
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
