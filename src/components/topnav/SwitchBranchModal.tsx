// src/components/topnav/SwitchBranchModal.tsx
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { topnavApi } from '@/api/topnav'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
}

const LS_KEY = 'active_branch_id'


export default function SwitchBranchModal({ open, onClose }: Props) {
  const { data } = useQuery({
    queryKey: ['topnav-branches'],
    queryFn: () => topnavApi.listBranches().then(r => r.data),
    enabled: open,
  })
  const branches: any[] = data?.data ?? []
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const stored = Number(localStorage.getItem(LS_KEY) || 0) || null
    const home = branches.find(b => b.is_home)
    setSelected(stored ?? home?.id ?? branches[0]?.id ?? null)
  }, [open, branches])

  if (!open) return null

  const handleUpdate = () => {
    if (selected) {
      localStorage.setItem(LS_KEY, String(selected))
    }
    onClose()
    // soft refresh so the new branch context picks up — but only if it actually changed
    setTimeout(() => window.location.reload(), 80)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-brand-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Switch Branch</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-2">
          {branches.length === 0
            ? <div className="text-center text-gray-400 py-6">No branches configured</div>
            : branches.map(b => (
              <label key={b.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer border transition-colors',
                  selected === b.id
                    ? 'bg-brand-50 border-brand-300'
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                )}>
                <input type="radio" name="branch"
                  checked={selected === b.id}
                  onChange={() => setSelected(b.id)}
                  className="w-4 h-4 accent-brand-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-800">
                  {b.name}
                  {b.is_home && <span className="text-gray-500"> (Home Branch)</span>}
                </span>
              </label>
            ))
          }
          <div className="flex justify-end pt-3">
            <button onClick={handleUpdate}
              disabled={!selected}
              className="btn btn-primary">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
