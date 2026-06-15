// src/pages/setup/tabs/SystemUpdateTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { setupApi } from '@/api/setup'

export default function SystemUpdateTab() {
  const { data } = useQuery({
    queryKey: ['setup-system-version'],
    queryFn: () => setupApi.systemVersion().then(r => r.data),
  })
  const v = data?.data?.version ?? '—'
  const latest = data?.data?.latest

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">System Update</h2>
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 text-center">
        <p className="text-brand-700 font-semibold">Your Cognate Version</p>
        <p className="text-3xl font-bold text-brand-700 mt-2">{v}</p>
      </div>
      {latest && (
        <p className="text-sm text-brand-700 flex items-center justify-center gap-1">
          <Info size={14}/> You are using latest version of Cognate.
        </p>
      )}
    </div>
  )
}
