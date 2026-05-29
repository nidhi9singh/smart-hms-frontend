// src/pages/downloads/UploadContentModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, UploadCloud } from 'lucide-react'
import { downloadsApi } from '@/api/downloads'

type Props = {
  open: boolean
  onClose: () => void
}

export default function UploadContentModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [contentTypeId, setContentTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [youtube, setYoutube] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const { data: typesData } = useQuery({
    queryKey: ['dc-types'],
    queryFn:  () => downloadsApi.listTypes().then(r => r.data),
    enabled:  open,
  })
  const types: any[] = typesData?.data ?? []

  useEffect(() => {
    if (open) {
      setContentTypeId('')
      setTitle('')
      setFile(null)
      setYoutube('')
      setDragOver(false)
    }
  }, [open])

  const save = useMutation({
    mutationFn: async () => {
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        if (title) fd.append('title', title)
        if (contentTypeId) fd.append('content_type_id', contentTypeId)
        return downloadsApi.uploadFile(fd)
      }
      if (youtube.trim()) {
        return downloadsApi.uploadYoutube({
          title: title || null,
          content_type_id: contentTypeId ? Number(contentTypeId) : null,
          youtube_link: youtube.trim(),
        })
      }
      throw new Error('Provide a file or YouTube link')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dc-contents'] })
      qc.invalidateQueries({ queryKey: ['dc-stats'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contentTypeId) return
    save.mutate()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[680px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-700 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Upload</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Content Type <span className="text-red-500">*</span>
            </label>
            <select
              required value={contentTypeId}
              onChange={e => setContentTypeId(e.target.value)}
              className="input w-full"
            >
              <option value="">Select</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title (optional)</label>
            <input
              type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Defaults to filename / link"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Upload Your File</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={
                  'border border-dashed rounded-md px-3 py-4 cursor-pointer flex items-center justify-center gap-2 text-sm ' +
                  (dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:bg-gray-50')
                }
              >
                <UploadCloud size={16} className="text-gray-500"/>
                <span className="text-gray-600 truncate">
                  {file ? file.name : 'Drop a file here or click'}
                </span>
              </div>
              <input
                ref={fileRef} type="file" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 text-sm pt-5">or</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Upload YouTube Video Link</label>
            <input
              type="url" value={youtube}
              onChange={e => setYoutube(e.target.value)}
              className="input w-full" placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {save.isError && (
            <p className="text-xs text-red-600">
              {(save.error as any)?.message || 'Upload failed'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button
              type="submit"
              disabled={save.isPending || !contentTypeId || (!file && !youtube.trim())}
              className="btn btn-primary"
            >
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
