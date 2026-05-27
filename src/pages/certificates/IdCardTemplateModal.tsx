// src/pages/certificates/IdCardTemplateModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, UploadCloud } from 'lucide-react'
import { certificatesApi } from '@/api/certificates'

type Variant = 'patient' | 'staff'
type Props = {
  open: boolean
  onClose: () => void
  variant: Variant
  template?: any
}

const PATIENT_FIELDS = [
  ['patient_name',    'Patient Name'],
  ['patient_id',      'Patient Id'],
  ['guardian_name',   'Guardian Name'],
  ['patient_address', 'Patient Address'],
  ['phone',           'Phone'],
  ['date_of_birth',   'Date Of Birth'],
  ['blood_group',     'Blood Group'],
  ['barcode',         'Barcode / QR Code'],
] as const

const STAFF_FIELDS = [
  ['name',            'Name'],
  ['staff_id',        'Staff ID'],
  ['designation',     'Designation'],
  ['department',      'Department'],
  ['father_name',     'Father Name'],
  ['mother_name',     'Mother Name'],
  ['date_of_joining', 'Date Of Joining'],
  ['current_address', 'Current Address'],
  ['phone',           'Phone'],
  ['date_of_birth',   'Date Of Birth'],
  ['barcode',         'Barcode / QR Code'],
] as const


function ImageUpload({
  label, value, onChange,
}: { label: string; value: string | null; onChange: (path: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (f: File) => {
    setBusy(true)
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await certificatesApi.uploadAsset(fd, label)
      onChange(res.data?.data?.path ?? null)
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handle(f) }}
        className="border border-dashed border-gray-300 rounded-md px-3 py-3 cursor-pointer flex items-center justify-center gap-2 text-sm hover:bg-gray-50"
      >
        <UploadCloud size={16} className="text-gray-500"/>
        <span className="text-gray-600 truncate">
          {busy ? 'Uploading…' : value ? value.split(/[\\/]/).pop() : 'Drop a file here or click'}
        </span>
      </div>
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }}
      />
    </div>
  )
}


export default function IdCardTemplateModal({ open, onClose, variant, template }: Props) {
  const qc = useQueryClient()
  const editing = !!template?.id
  const isPatient = variant === 'patient'
  const FIELDS = isPatient ? PATIENT_FIELDS : STAFF_FIELDS

  const [cfg, setCfg] = useState<any>({
    background_image: null,
    logo: null,
    signature: null,
    hospital_name: '',
    address: '',
    id_card_title: '',
    header_color: '#0d9488',
    fields: {} as Record<string, boolean>,
  })

  useEffect(() => {
    if (open) {
      const tc = template?.config ?? {}
      setCfg({
        background_image: tc.background_image ?? null,
        logo            : tc.logo ?? null,
        signature       : tc.signature ?? null,
        hospital_name   : tc.hospital_name ?? '',
        address         : tc.address ?? '',
        id_card_title   : tc.id_card_title ?? '',
        header_color    : tc.header_color ?? '#0d9488',
        fields          : tc.fields ?? {},
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cfg.hospital_name.trim() || !cfg.id_card_title.trim() || !cfg.address.trim()) return
    save.mutate({
      name         : cfg.id_card_title.trim(),
      template_type: isPatient ? 'patient_id' : 'staff_id',
      content      : null,
      config       : {
        background_image: cfg.background_image,
        logo            : cfg.logo,
        signature       : cfg.signature,
        hospital_name   : cfg.hospital_name.trim(),
        address         : cfg.address.trim(),
        id_card_title   : cfg.id_card_title.trim(),
        header_color    : cfg.header_color,
        fields          : cfg.fields,
      },
    })
  }

  const setField = (k: string, v: boolean) =>
    setCfg((c: any) => ({ ...c, fields: { ...c.fields, [k]: v } }))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[680px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-700 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">
            {editing ? 'Edit' : 'Add'} {isPatient ? 'Patient' : 'Staff'} ID Card
          </h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <ImageUpload label="Background Image"
            value={cfg.background_image} onChange={p => setCfg({ ...cfg, background_image: p })}/>
          <ImageUpload label="Logo"
            value={cfg.logo} onChange={p => setCfg({ ...cfg, logo: p })}/>
          <ImageUpload label="Signature"
            value={cfg.signature} onChange={p => setCfg({ ...cfg, signature: p })}/>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hospital Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={cfg.hospital_name}
              onChange={e => setCfg({ ...cfg, hospital_name: e.target.value })}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Address / Phone / Email <span className="text-red-500">*</span>
            </label>
            <textarea
              required value={cfg.address}
              onChange={e => setCfg({ ...cfg, address: e.target.value })}
              className="input w-full" rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isPatient ? 'Patient ID Card Title' : 'ID Card Title'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={cfg.id_card_title}
              onChange={e => setCfg({ ...cfg, id_card_title: e.target.value })}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Header Color</label>
            <input
              type="color" value={cfg.header_color}
              onChange={e => setCfg({ ...cfg, header_color: e.target.value })}
              className="h-9 w-16 border rounded cursor-pointer"
            />
          </div>

          <div className="border-t pt-3 grid grid-cols-2 gap-2">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox" checked={!!cfg.fields[key]}
                  onChange={e => setField(key, e.target.checked)}
                  className="rounded"
                />
              </label>
            ))}
          </div>

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
