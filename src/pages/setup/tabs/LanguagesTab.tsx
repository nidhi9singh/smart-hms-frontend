// src/pages/setup/tabs/LanguagesTab.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'

export default function LanguagesTab() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['setup-languages'],
    queryFn: () => setupApi.listLanguages().then(r => r.data),
  })
  const rows: any[] = data?.data ?? []

  const upd = useMutation({
    mutationFn: ({ id, payload }: any) => setupApi.updateLanguage(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-languages'] }),
  })

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Language List</h2>
      <p className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded">
        To change language key phrases, go your language directory.
      </p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Language</th>
            <th className="px-3 py-2">Short Code</th>
            <th className="px-3 py-2">Country Code</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Default</th>
            <th className="px-3 py-2">Is RTL</th>
            <th className="px-3 py-2 text-right">Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : rows.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 text-gray-500">{i + 1}.</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.short_code}</td>
                <td className="px-3 py-2">{r.country_code || '—'}</td>
                <td className="px-3 py-2">
                  {r.is_active && <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">Active</span>}
                </td>
                <td className="px-3 py-2">
                  <input type="radio" name="default-lang" checked={!!r.is_default}
                    onChange={() => upd.mutate({ id: r.id, payload: { is_default: true, is_active: true } })}/>
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={!!r.is_rtl}
                    onChange={e => upd.mutate({ id: r.id, payload: { is_rtl: e.target.checked } })}/>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => upd.mutate({ id: r.id, payload: { is_active: !r.is_active } })}
                    className={'inline-flex items-center w-10 h-5 rounded-full transition-colors ' +
                      (r.is_active ? 'bg-emerald-600' : 'bg-gray-300')}>
                    <span className={'w-4 h-4 bg-white rounded-full transition-transform ' +
                      (r.is_active ? 'translate-x-5' : 'translate-x-0.5')}/>
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
