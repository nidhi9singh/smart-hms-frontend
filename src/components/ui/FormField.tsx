// src/components/ui/FormField.tsx
import type { ReactNode } from 'react'

interface Props {
  label: string
  error?: string
  children: ReactNode
  required?: boolean
}

export default function FormField({ label, error, children, required }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
