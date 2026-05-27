// src/components/ui/Pagination.tsx
interface Props {
  page: number
  totalPages: number
  total: number
  perPage: number
  shown: number
  onNext: () => void
  onPrev: () => void
}

export default function Pagination({ page, totalPages, total, shown, onNext, onPrev }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
      <span>Showing {shown} of {total} records</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={onPrev}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">←</button>
        <span className="px-3 py-1">{page} / {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={onNext}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">→</button>
      </div>
    </div>
  )
}
