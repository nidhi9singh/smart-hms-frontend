// src/pages/setup/tabs/ModulesTab.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'
import { cn } from '@/lib/utils'

type ModuleRow = {
  id: number; module_key: string; module_name: string;
  module_type: string; enabled: boolean; sort_order: number;
}


export default function ModulesTab() {
  const qc = useQueryClient()
  const [view, setView] = useState<'System' | 'Patient'>('System')

  const { data } = useQuery({
    queryKey: ['setup-modules', view],
    queryFn: () => setupApi.listModules({ module_type: view }).then(r => r.data),
  })
  const rows: ModuleRow[] = data?.data ?? []

  const toggle = useMutation({
    mutationFn: (r: ModuleRow) => setupApi.updateModule(r.module_key, { enabled: !r.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-modules'] }),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-base font-semibold text-gray-800">Modules</h2>
        <div className="flex">
          {(['System', 'Patient'] as const).map(t => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={cn(
                'px-4 py-1.5 text-sm border-b-2',
                view === t ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500'
              )}
            >{t}</button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : rows.map(r => (
              <tr key={r.module_key} className="border-t">
                <td className="px-3 py-2">{r.module_name}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => toggle.mutate(r)}
                    className={'inline-flex items-center w-10 h-5 rounded-full transition-colors ' +
                      (r.enabled ? 'bg-brand-600' : 'bg-gray-300')}>
                    <span className={'w-4 h-4 bg-white rounded-full transition-transform ' +
                      (r.enabled ? 'translate-x-5' : 'translate-x-0.5')}/>
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
