// src/pages/setup/tabs/CaptchaSettingTab.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'

export default function CaptchaSettingTab() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['setup-captcha'],
    queryFn: () => setupApi.listCaptcha().then(r => r.data),
  })
  const rows: any[] = data?.data ?? []

  const toggle = useMutation({
    mutationFn: (r: any) => setupApi.updateCaptcha(r.page_key, { enabled: !r.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-captcha'] }),
  })

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Captcha Settings</h2>
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
              <tr key={r.page_key} className="border-t">
                <td className="px-3 py-2">{r.page_name}</td>
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
      <p className="text-xs text-gray-400">Records: {rows.length}</p>
    </div>
  )
}
