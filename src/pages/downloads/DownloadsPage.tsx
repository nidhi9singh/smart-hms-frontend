// src/pages/downloads/DownloadsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Trash2, Edit2, Download, Upload,
  FileText, FileImage, FileVideo, Youtube, File as FileIcon,
  Grid3x3, List as ListIcon, Eye,
} from 'lucide-react'
import api from '@/lib/axios'
import { downloadsApi } from '@/api/downloads'
import UploadContentModal from './UploadContentModal'
import ContentTypeModal   from './ContentTypeModal'
import ShareContentModal  from './ShareContentModal'
import { cn } from '@/lib/utils'

type Tab = 'contents' | 'shares' | 'types'

type Props = { defaultTab?: Tab }

function formatSize(kb: number | null | undefined) {
  if (kb == null) return '—'
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`
  return `${kb.toFixed(2)} KB`
}

function fileIcon(type: string | null | undefined) {
  const t = (type || '').toLowerCase()
  if (t === 'youtube')    return <Youtube    size={28} className="text-red-500" />
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(t))      return <FileImage size={28} className="text-blue-500" />
  if (['mp4','mov','avi','mkv','webm'].includes(t))             return <FileVideo size={28} className="text-purple-500" />
  if (t === 'pdf')                                              return <FileIcon  size={28} className="text-red-600" />
  if (['doc','docx'].includes(t))                               return <FileText  size={28} className="text-blue-600" />
  return <FileText size={28} className="text-gray-500" />
}

export default function DownloadsPage({ defaultTab = 'contents' }: Props) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [shareOpen, setShareOpen]     = useState(false)
  const [typeModal, setTypeModal]     = useState<{ open: boolean; type?: any }>({ open: false })

  const { data: contentsData, isLoading: cLoading } = useQuery({
    queryKey: ['dc-contents', search],
    queryFn:  () => downloadsApi.listContents({ search, per_page: 200 }).then(r => r.data),
    enabled:  tab === 'contents',
  })
  const { data: sharesData, isLoading: sLoading } = useQuery({
    queryKey: ['dc-shares', search],
    queryFn:  () => downloadsApi.listShares({ search, per_page: 200 }).then(r => r.data),
    enabled:  tab === 'shares',
  })
  const { data: typesData, isLoading: tLoading } = useQuery({
    queryKey: ['dc-types', search],
    queryFn:  () => downloadsApi.listTypes({ search }).then(r => r.data),
    enabled:  tab === 'types',
  })
  const { data: statsData } = useQuery({
    queryKey: ['dc-stats'],
    queryFn:  () => downloadsApi.stats().then(r => r.data),
  })

  const contents: any[] = contentsData?.data ?? []
  const shares:   any[] = sharesData?.data   ?? []
  const types:    any[] = typesData?.data    ?? []
  const stats           = statsData?.data    ?? { total_documents: 0, total_size_kb: 0 }

  const delContent = useMutation({
    mutationFn: (id: number) => downloadsApi.deleteContent(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['dc-contents'] })
      qc.invalidateQueries({ queryKey: ['dc-stats'] })
    },
  })
  const delShare = useMutation({
    mutationFn: (id: number) => downloadsApi.deleteShare(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dc-shares'] }),
  })
  const delType = useMutation({
    mutationFn: (id: number) => downloadsApi.deleteType(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dc-types'] }),
  })

  const handleDownload = async (c: any) => {
    if (c.youtube_link) {
      window.open(c.youtube_link, '_blank')
      return
    }
    try {
      const res = await api.get(downloadsApi.downloadUrl(c.id), { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = c.file_name || c.title || 'download'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Failed to download file')
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Download Centre</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload, share and organise documents</p>
        </div>
        <div className="flex gap-2">
          {tab === 'contents' && (
            <button onClick={() => setUploadOpen(true)} className="btn btn-primary flex items-center gap-1.5">
              <Upload size={14}/> Upload
            </button>
          )}
          {tab === 'shares' && (
            <button onClick={() => setShareOpen(true)} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Share Content
            </button>
          )}
          {tab === 'types' && (
            <button onClick={() => setTypeModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Add Content Type
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Documents', value: stats.total_documents,                  color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Size',      value: formatSize(stats.total_size_kb),        color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Shares',          value: shares.length || (sharesData?.total ?? 0), color: 'bg-amber-50 text-amber-700' },
          { label: 'Content Types',   value: types.length || (typesData?.total  ?? 0), color: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('px-3 h-9 rounded-lg flex items-center justify-center font-bold text-xs', s.color)}>{s.value}</div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'contents', label: 'Content List' },
            { id: 'shares',   label: 'Content Share List' },
            { id: 'types',    label: 'Content Type' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-teal-600 text-teal-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="input pl-8 w-64"
          />
        </div>
        {tab === 'contents' && (
          <div className="flex border rounded">
            <button onClick={() => setView('list')}
              className={cn('p-1.5', view === 'list' ? 'bg-gray-100' : '')}>
              <ListIcon size={16}/>
            </button>
            <button onClick={() => setView('grid')}
              className={cn('p-1.5 border-l', view === 'grid' ? 'bg-gray-100' : '')}>
              <Grid3x3 size={16}/>
            </button>
          </div>
        )}
      </div>

      {tab === 'contents' && (
        cLoading ? (
          <div className="text-center text-gray-400 py-10">Loading…</div>
        ) : contents.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No content yet</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
            {contents.map(c => (
              <div key={c.id} className="card p-3 flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-50 rounded flex items-center justify-center">
                  {fileIcon(c.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate" title={c.title}>{c.title}</p>
                  <p className="text-xs text-gray-500 truncate">{c.uploaded_by_name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                    {c.file_size_kb ? ` · ${formatSize(c.file_size_kb)}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleDownload(c)}
                    title="Download / Open"
                    className="p-1 hover:bg-blue-50 rounded text-blue-600"
                  >
                    <Download size={14}/>
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this content?')) delContent.mutate(c.id) }}
                    title="Delete"
                    className="p-1 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Content Type</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Size</th>
                  <th className="px-3 py-2">Uploaded By</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {contents.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{c.title}</td>
                    <td className="px-3 py-2 text-gray-600">{c.content_type || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{c.file_type || '—'}</td>
                    <td className="px-3 py-2 text-right">{formatSize(c.file_size_kb)}</td>
                    <td className="px-3 py-2 text-gray-600">{c.uploaded_by_name || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDownload(c)} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Download size={14}/></button>
                        <button onClick={() => { if (confirm('Delete this content?')) delContent.mutate(c.id) }} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'shares' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Send To</th>
                <th className="px-3 py-2">Share Date</th>
                <th className="px-3 py-2">Valid Upto</th>
                <th className="px-3 py-2">Shared By</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sLoading ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : shares.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No shares yet</td></tr>
              ) : shares.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{s.title}</td>
                  <td className="px-3 py-2 text-gray-600">{s.send_to}</td>
                  <td className="px-3 py-2 text-gray-600">{s.share_date ? new Date(s.share_date).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.valid_upto ? new Date(s.valid_upto).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.shared_by_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-sm truncate">{s.description || 'No Description'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button title="View" className="p-1 hover:bg-blue-50 rounded text-blue-600"><Eye size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this share?')) delShare.mutate(s.id) }} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'types' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tLoading ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No content types</td></tr>
              ) : types.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{t.name}</td>
                  <td className="px-3 py-2 text-gray-600">{t.description || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setTypeModal({ open: true, type: t })} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this content type?')) delType.mutate(t.id) }} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadContentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <ShareContentModal  open={shareOpen}  onClose={() => setShareOpen(false)}  />
      <ContentTypeModal
        open={typeModal.open}
        type={typeModal.type}
        onClose={() => setTypeModal({ open: false })}
      />
    </div>
  )
}
