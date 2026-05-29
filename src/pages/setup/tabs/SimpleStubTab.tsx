// src/pages/setup/tabs/SimpleStubTab.tsx
import { FolderCog } from 'lucide-react'

type Props = { title: string; description: string }

export default function SimpleStubTab({ title, description }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">{title}</h2>
      <div className="border-dashed border rounded p-8 text-center text-gray-500">
        <FolderCog size={28} className="mx-auto mb-2 text-gray-400"/>
        <p className="text-sm">{description}</p>
        <p className="text-xs mt-2 text-gray-400">UI shell only — provider integration is out of scope.</p>
      </div>
    </div>
  )
}
