// src/pages/downloads/ShareContentModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { downloadsApi } from '@/api/downloads'

type Props = {
  open: boolean
  onClose: () => void
}

export default function ShareContentModal({ open, onClose }: Props) {
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title: '',
    content_id: '',
    send_to: 'Group',
    share_date: new Date().toISOString().slice(0, 10),
    valid_upto: '',
    description: '',
  })

  const { data: contentsData } = useQuery({
    queryKey: ['dc-contents-all'],
    queryFn:  () => downloadsApi.listContents({ per_page: 500 }).then(r => r.data),
    enabled:  open,
  })
  const contents: any[] = contentsData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        title: '',
        content_id: '',
        send_to: 'Group',
        share_date: new Date().toISOString().slice(0, 10),
        valid_upto: '',
        description: '',
      })
    }
  }, [open])

  const save = useMutation({
    mutationFn: (payload: any) => downloadsApi.shareContent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dc-shares'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    save.mutate({
      title      : form.title.trim(),
      content_id : form.content_id ? Number(form.content_id) : null,
      send_to    : form.send_to,
      share_date : form.share_date || null,
      valid_upto : form.valid_upto || null,
      description: form.description || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-700 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Share Content</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
              <select
                value={form.content_id}
                onChange={e => setForm({ ...form, content_id: e.target.value })}
                className="input w-full"
              >
                <option value="">— None —</option>
                {contents.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
              <select
                value={form.send_to}
                onChange={e => setForm({ ...form, send_to: e.target.value })}
                className="input w-full"
              >
                <option>Group</option>
                <option>Individual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Share Date</label>
              <input
                type="date" value={form.share_date}
                onChange={e => setForm({ ...form, share_date: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid Upto</label>
              <input
                type="date" value={form.valid_upto}
                onChange={e => setForm({ ...form, valid_upto: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full" rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
