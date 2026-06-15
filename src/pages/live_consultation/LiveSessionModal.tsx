// src/pages/live_consultation/LiveSessionModal.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Video } from 'lucide-react'
import { liveApi } from '@/api/liveConsultation'

type Props = {
  open: boolean
  onClose: () => void
  kind: 'consultation' | 'meeting'
  item: any | null
}


export default function LiveSessionModal({ open, onClose, kind, item }: Props) {
  const qc = useQueryClient()
  const start = useMutation({
    mutationFn: () => {
      const next = item.status === 'Started' ? 'Finished' : 'Started'
      return kind === 'consultation'
        ? liveApi.updateConsultation(item.id, { status: next })
        : liveApi.updateMeeting(item.id, { status: next })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [kind === 'consultation' ? 'live-consultations' : 'live-meetings'] })
      onClose()
      if (item.meeting_link) window.open(item.meeting_link, '_blank')
    },
  })

  if (!open || !item) return null

  const date = item.consultation_date || item.meeting_date
  const isMeeting = kind === 'meeting'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[640px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{item.title}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-5 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Host</p>
              <p className="text-sm">{item.created_by_name || 'Self'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="text-sm">{date ? new Date(date).toLocaleString() : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Duration (In Minutes)</p>
              <p className="text-sm">{item.duration_minutes ?? '—'}</p>
            </div>
          </div>
          {item.description && (
            <div className="text-sm text-gray-600 border-t pt-3">{item.description}</div>
          )}
          <div className="flex justify-end pt-4 border-t mt-3">
            <button
              onClick={() => start.mutate()}
              disabled={start.isPending}
              className="border border-brand-500 text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded text-sm flex items-center gap-1.5"
            >
              <Video size={14}/>{isMeeting ? 'Join' : 'Start Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
