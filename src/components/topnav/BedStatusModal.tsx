// src/components/topnav/BedStatusModal.tsx
import { useQuery } from '@tanstack/react-query'
import { X, BedDouble } from 'lucide-react'
import { topnavApi } from '@/api/topnav'

type Props = { open: boolean; onClose: () => void }


export default function BedStatusModal({ open, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['topnav-bed-status'],
    queryFn: () => topnavApi.bedStatus().then(r => r.data),
    enabled: open,
  })

  if (!open) return null
  const floors: any[] = data?.data ?? []

  return (
    <div className="fixed inset-0 z-50 bg-gray-700/80 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-end mb-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700">
            <X size={16}/>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-white py-10">Loading…</div>
        ) : floors.length === 0 ? (
          <div className="text-center text-white py-10">No bed data</div>
        ) : floors.map(f => (
          <div key={f.floor} className="mb-5 bg-gray-600/95 rounded p-3">
            <div className="inline-block px-3 py-1 bg-gray-800 text-white text-xs rounded-full mb-2">
              {f.floor}
            </div>
            <div className="text-xs text-white/70 mb-2">
              Total {f.total} · Occupied {f.occupied} · Available {f.available}
            </div>
            {f.wards.map((w: any) => (
              <div key={w.ward_type} className="bg-gray-100 rounded mb-2 p-3">
                <div className="flex items-center justify-center mb-2">
                  <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">{w.ward_type}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                  {w.beds.map((b: any) => (
                    <div key={b.id} className="text-center">
                      <BedDouble
                        size={36}
                        className={b.occupied ? 'mx-auto text-pink-400' : 'mx-auto text-emerald-500'}
                      />
                      <p className={'text-xs font-medium mt-1 truncate ' + (b.occupied ? 'text-pink-500' : 'text-emerald-600')}
                        title={b.patient_name || b.bed_no}>
                        {b.patient_name || b.bed_no}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
