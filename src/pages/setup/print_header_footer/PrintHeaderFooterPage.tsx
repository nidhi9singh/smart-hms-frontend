// src/pages/setup/print_header_footer/PrintHeaderFooterPage.tsx
import { useState } from 'react'
import { Printer, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function PrintHeaderFooterPage() {
  const [headerImg, setHeaderImg] = useState<File | null>(null)
  const [footerImg, setFooterImg] = useState<File | null>(null)
  const [headerHtml, setHeaderHtml] = useState('')
  const [footerHtml, setFooterHtml] = useState('')

  const save = () => {
    // Backend wiring placeholder — currently keeps the values in form state only.
    toast.success('Print header/footer saved (preview only — backend wiring pending)')
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Print Header / Footer</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Customise the header and footer that appear on printed receipts, bills and reports.
        </p>
      </div>

      <section className="card p-5 space-y-4">
        <header className="flex items-center gap-2">
          <ImageIcon size={16} className="text-emerald-600"/>
          <h2 className="text-sm font-semibold text-gray-800">Header</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Header Image</label>
            <input type="file" accept="image/*"
              onChange={e => setHeaderImg(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
            {headerImg && <p className="mt-1 text-[11px] text-gray-500">{headerImg.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Header HTML</label>
            <textarea rows={4} value={headerHtml}
              onChange={e => setHeaderHtml(e.target.value)}
              placeholder="<div>Smart Hospital · 25 Kings Street · +91 9876 543 210</div>"
              className="input w-full text-xs font-mono"/>
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <header className="flex items-center gap-2">
          <Printer size={16} className="text-emerald-600"/>
          <h2 className="text-sm font-semibold text-gray-800">Footer</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Footer Image</label>
            <input type="file" accept="image/*"
              onChange={e => setFooterImg(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
            {footerImg && <p className="mt-1 text-[11px] text-gray-500">{footerImg.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Footer HTML</label>
            <textarea rows={4} value={footerHtml}
              onChange={e => setFooterHtml(e.target.value)}
              placeholder="<div>Thank you for choosing Smart Hospital.</div>"
              className="input w-full text-xs font-mono"/>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} className="btn btn-primary px-6">Save</button>
      </div>
    </div>
  )
}
