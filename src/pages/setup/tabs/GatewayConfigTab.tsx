// src/pages/setup/tabs/GatewayConfigTab.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'
import { cn } from '@/lib/utils'

type GatewayField = { key: string; label: string; type?: 'text' | 'password' | 'select'; options?: string[] }
type Gateway = { id: string; name: string; fields: GatewayField[] }

type Props = {
  title: string
  /** Scope prefix; final scope is `${scopePrefix}_${gateway.id}` */
  scopePrefix: string
  gateways: Gateway[]
  description?: string
}


export default function GatewayConfigTab({ title, scopePrefix, gateways, description }: Props) {
  const [activeId, setActiveId] = useState(gateways[0]?.id)
  const active = gateways.find(g => g.id === activeId) || gateways[0]
  const scope = `${scopePrefix}_${active.id}`

  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['setup-app-settings', scope],
    queryFn: () => setupApi.getAppSettings(scope).then(r => r.data),
  })
  const stored = data?.data ?? {}
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => { setForm({ ...(stored as any) }) }, [stored])

  const save = useMutation({
    mutationFn: (payload: any) => setupApi.saveAppSettings(scope, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-app-settings', scope] }),
  })

  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {gateways.map(g => (
          <button key={g.id} onClick={() => setActiveId(g.id)}
            className={cn('px-3 py-1.5 text-sm border-b-2 -mb-px',
              activeId === g.id ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >{g.name}</button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="space-y-3 max-w-2xl pt-2">
        {active.fields.map(f => (
          <div key={f.key} className="grid grid-cols-3 items-center gap-3">
            <label className="text-sm text-gray-700 text-right">{f.label}</label>
            <div className="col-span-2">
              {f.type === 'select' ? (
                <select value={form[f.key] ?? ''}
                  onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                  className="input w-full">
                  <option value="">Select</option>
                  {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type === 'password' ? 'password' : 'text'}
                  value={form[f.key] ?? ''}
                  onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                  className="input w-full"/>
              )}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3">
          <div/>
          <div className="col-span-2">
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
