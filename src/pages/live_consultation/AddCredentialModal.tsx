// src/pages/live_consultation/AddCredentialModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { setupApi } from '@/api/setup'

interface Props {
  open: boolean
  onClose: () => void
}

const SCOPE = 'zoom'

export default function AddCredentialModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [apiKey, setApiKey]       = useState('')
  const [apiSecret, setApiSecret] = useState('')

  // Pre-fill with whatever is already saved (so admins can audit / rotate).
  const { data: existing } = useQuery({
    queryKey: ['zoom-credentials'],
    queryFn:  () => setupApi.getAppSettings(SCOPE).then(r => r.data?.data ?? {}),
    enabled:  open,
  })

  useEffect(() => {
    if (open) {
      setApiKey(existing?.api_key ?? '')
      setApiSecret(existing?.api_secret ?? '')
    }
  }, [open, existing])

  const save = useMutation({
    mutationFn: () => setupApi.saveAppSettings(SCOPE, {
      api_key:    apiKey.trim(),
      api_secret: apiSecret.trim(),
    }),
    onSuccess: () => {
      toast.success('Zoom credentials saved')
      qc.invalidateQueries({ queryKey: ['zoom-credentials'] })
      onClose()
    },
    onError: (e: any) => {
      const d = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Failed to save credentials'
      toast.error(typeof d === 'string' ? d : JSON.stringify(d))
    },
  })

  const reset = () => {
    setApiKey('')
    setApiSecret('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[560px] max-w-[95vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#47C0BD] text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Add Credential</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!apiKey || !apiSecret) return; save.mutate() }}
          className="p-5 space-y-4">
          <Field label="Zoom Api Key" required>
            <input required value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="input w-full font-mono text-sm"
              placeholder="paste your Zoom API key"/>
          </Field>

          <Field label="Zoom Api Secret" required>
            <input required type="password" value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              className="input w-full font-mono text-sm"
              placeholder="paste your Zoom API secret"/>
          </Field>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={reset}
              className="px-5 py-2 bg-[#47C0BD] hover:bg-[#309C99] text-white text-sm font-medium rounded">
              Reset
            </button>
            <button type="submit" disabled={save.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#47C0BD] hover:bg-[#309C99] text-white text-sm font-medium rounded">
              {save.isPending && <Loader2 size={14} className="animate-spin"/>} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
