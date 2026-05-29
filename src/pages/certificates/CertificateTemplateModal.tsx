// src/pages/certificates/CertificateTemplateModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { certificatesApi } from '@/api/certificates'

type Props = {
  open: boolean
  onClose: () => void
  template?: any
}

const PLACEHOLDERS = [
  '[patient_name]', '[patient_id]', '[dob]', '[age]', '[gender]', '[email]',
  '[phone]', '[address]', '[opd_ipd_no]', '[guardian_name]', '[opd_checkup_id]', '[consultant_doctor]',
]

export default function CertificateTemplateModal({ open, onClose, template }: Props) {
  const qc = useQueryClient()
  const editing = !!template?.id
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [cfg, setCfg] = useState<any>({
    header_left: '', header_center: '', header_right: '',
    footer_left: '', footer_center: '', footer_right: '',
    header_height: '', body_height: '', body_width: '', footer_height: '',
    patient_photo: false,
  })

  useEffect(() => {
    if (open) {
      setName(template?.name ?? '')
      setContent(template?.content ?? '')
      const tc = template?.config ?? {}
      setCfg({
        header_left   : tc.header_left   ?? '',
        header_center : tc.header_center ?? '',
        header_right  : tc.header_right  ?? '',
        footer_left   : tc.footer_left   ?? '',
        footer_center : tc.footer_center ?? '',
        footer_right  : tc.footer_right  ?? '',
        header_height : tc.header_height ?? '',
        body_height   : tc.body_height   ?? '',
        body_width    : tc.body_width    ?? '',
        footer_height : tc.footer_height ?? '',
        patient_photo : !!tc.patient_photo,
      })
    }
  }, [open, template])

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? certificatesApi.updateTemplate(template.id, payload)
        : certificatesApi.addTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cert-templates'] })
      onClose()
    },
  })

  if (!open) return null

  const insertPlaceholder = (ph: string) => {
    const ta = bodyRef.current
    if (!ta) { setContent(c => c + ' ' + ph); return }
    const start = ta.selectionStart, end = ta.selectionEnd
    setContent(c => c.slice(0, start) + ph + c.slice(end))
    setTimeout(() => {
      ta.focus()
      const pos = start + ph.length
      ta.setSelectionRange(pos, pos)
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    save.mutate({
      name         : name.trim(),
      template_type: editing ? template.template_type : 'patient_certificate',
      content      : content,
      config       : {
        header_left  : cfg.header_left  || null,
        header_center: cfg.header_center|| null,
        header_right : cfg.header_right || null,
        footer_left  : cfg.footer_left  || null,
        footer_center: cfg.footer_center|| null,
        footer_right : cfg.footer_right || null,
        header_height: cfg.header_height ? Number(cfg.header_height) : null,
        body_height  : cfg.body_height   ? Number(cfg.body_height)   : null,
        body_width   : cfg.body_width    ? Number(cfg.body_width)    : null,
        footer_height: cfg.footer_height ? Number(cfg.footer_height) : null,
        patient_photo: !!cfg.patient_photo,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[760px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-700 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{editing ? 'Edit Certificate Template' : 'Add Certificate Template'}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Certificate Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={name}
              onChange={e => setName(e.target.value)}
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Header Left Text</label>
              <input type="text" value={cfg.header_left}  onChange={e => setCfg({ ...cfg, header_left:  e.target.value })} className="input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Header Center Text</label>
              <input type="text" value={cfg.header_center} onChange={e => setCfg({ ...cfg, header_center: e.target.value })} className="input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Header Right Text</label>
              <input type="text" value={cfg.header_right} onChange={e => setCfg({ ...cfg, header_right: e.target.value })} className="input w-full"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Body Text <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={bodyRef} required value={content}
              onChange={e => setContent(e.target.value)}
              className="input w-full" rows={6}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {PLACEHOLDERS.map(ph => (
                <button
                  key={ph} type="button"
                  onClick={() => insertPlaceholder(ph)}
                  className="text-xs text-emerald-600 hover:underline"
                >{ph}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Footer Left Text</label>
              <input type="text" value={cfg.footer_left}  onChange={e => setCfg({ ...cfg, footer_left:  e.target.value })} className="input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Footer Center Text</label>
              <input type="text" value={cfg.footer_center} onChange={e => setCfg({ ...cfg, footer_center: e.target.value })} className="input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Footer Right Text</label>
              <input type="text" value={cfg.footer_right} onChange={e => setCfg({ ...cfg, footer_right: e.target.value })} className="input w-full"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Design</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Header Height" value={cfg.header_height} onChange={e => setCfg({ ...cfg, header_height: e.target.value })} className="input w-full"/>
              <input type="number" placeholder="Footer Height" value={cfg.footer_height} onChange={e => setCfg({ ...cfg, footer_height: e.target.value })} className="input w-full"/>
              <input type="number" placeholder="Body Height"   value={cfg.body_height}   onChange={e => setCfg({ ...cfg, body_height:   e.target.value })} className="input w-full"/>
              <input type="number" placeholder="Body Width"    value={cfg.body_width}    onChange={e => setCfg({ ...cfg, body_width:    e.target.value })} className="input w-full"/>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={!!cfg.patient_photo}
              onChange={e => setCfg({ ...cfg, patient_photo: e.target.checked })}
              className="rounded"
            />
            Patient Photo
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
