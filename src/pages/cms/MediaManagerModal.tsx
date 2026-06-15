// src/pages/cms/MediaManagerModal.tsx
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, UploadCloud, Trash2, FileImage, FileText, Youtube } from 'lucide-react'
import api from '@/lib/axios'
import { cmsApi } from '@/api/cms'

type Props = {
  open: boolean
  onClose: () => void
  /** When set, clicking an item selects it (used as a picker) */
  onSelect?: (item: any) => void
}

const FILE_TYPES = ['', 'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'youtube']


function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (api.defaults?.baseURL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/,'')
  return `${base}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`
}


function mediaIcon(t: string | null | undefined) {
  const x = (t || '').toLowerCase()
  if (x === 'youtube') return <Youtube    size={20} className="text-red-500"/>
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(x)) return <FileImage size={20} className="text-brand-500"/>
  return <FileText size={20} className="text-gray-500"/>
}


export default function MediaManagerModal({ open, onClose, onSelect }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [youtube, setYoutube] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['cms-media', search, fileType],
    queryFn:  () => cmsApi.listMedia({
      search   : search    || undefined,
      file_type: fileType  || undefined,
      per_page : 200,
    }).then(r => r.data),
    enabled: open,
  })
  const items: any[] = data?.data ?? []

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return cmsApi.uploadMedia(fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-media'] }),
  })

  const addYt = useMutation({
    mutationFn: (link: string) => cmsApi.addYoutube({ youtube_link: link }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-media'] })
      setYoutube('')
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => cmsApi.deleteMedia(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cms-media'] }),
  })

  if (!open) return null

  const submitYoutube = () => {
    if (!youtube.trim()) return
    addYt.mutate(youtube.trim())
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-6 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[1100px] max-w-[97vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-700 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Media Manager</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        {/* Upload row — hidden when used as picker (modal screenshot shows it) */}
        {!onSelect && (
          <div className="p-5 grid grid-cols-2 gap-6 border-b">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Upload Your File</label>
              <input
                ref={fileRef} type="file" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) upload.mutate(f) }}
              />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload.mutate(f) }}
                className="border border-dashed rounded-md px-3 py-3 cursor-pointer flex items-center justify-center gap-2 text-sm hover:bg-gray-50"
              >
                <UploadCloud size={16} className="text-gray-500"/>
                <span className="text-gray-600">
                  {upload.isPending ? 'Uploading…' : 'Drop a file here or click'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upload YouTube Video <span className="text-gray-400">(or instead of file)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url" value={youtube}
                  onChange={e => setYoutube(e.target.value)}
                  placeholder="URL"
                  className="input flex-1"
                />
                <button
                  type="button" onClick={submitYoutube}
                  disabled={addYt.isPending || !youtube.trim()}
                  className="btn btn-primary"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 grid grid-cols-2 gap-6 border-b">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search By File Name</label>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Enter Keyword…"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter By File Type</label>
            <select
              value={fileType} onChange={e => setFileType(e.target.value)}
              className="input w-full"
            >
              {FILE_TYPES.map(t => (
                <option key={t} value={t}>{t || 'Select'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No media yet</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {items.map(m => (
                <div key={m.id} className="border rounded overflow-hidden group">
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative">
                    {m.file_type && ['jpg','jpeg','png','gif','webp','bmp'].includes(m.file_type) && m.file_path ? (
                      <img
                        src={assetUrl(m.file_path) ?? ''}
                        alt={m.file_name ?? ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        {mediaIcon(m.file_type)}
                        <span className="text-[10px] mt-1 uppercase">{m.file_type || 'file'}</span>
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-white/80 rounded p-0.5">
                      {mediaIcon(m.file_type)}
                    </div>
                  </div>
                  <div className="p-2 flex items-center justify-between gap-1">
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => { onSelect(m); onClose() }}
                        className="text-xs text-brand-600 hover:underline truncate flex-1 text-left"
                        title={m.file_name ?? m.youtube_link ?? ''}
                      >
                        {(m.file_name ?? m.youtube_link ?? '').toString().slice(0, 30)}
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 truncate flex-1" title={m.file_name ?? m.youtube_link ?? ''}>
                        {(m.file_name ?? m.youtube_link ?? '').toString().slice(0, 30)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => { if (confirm('Delete this media?')) del.mutate(m.id) }}
                      className="p-0.5 hover:bg-red-50 rounded text-red-500"
                      title="Delete"
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
    </div>
  )
}
