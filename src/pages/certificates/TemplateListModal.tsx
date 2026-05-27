// src/pages/certificates/TemplateListModal.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Edit2, Trash2, ListIcon, FileImage } from 'lucide-react'
import { certificatesApi } from '@/api/certificates'
import CertificateTemplateModal from './CertificateTemplateModal'
import IdCardTemplateModal from './IdCardTemplateModal'

type Variant = 'certificate' | 'patient_id' | 'staff_id'

type Props = {
  open: boolean
  onClose: () => void
  variant: Variant
}

const META: Record<Variant, { typeKey: string; title: string }> = {
  certificate: { typeKey: 'patient_certificate', title: 'Certificate Template List' },
  patient_id : { typeKey: 'patient_id',          title: 'Patient ID Card List'      },
  staff_id   : { typeKey: 'staff_id',            title: 'Staff ID Card List'        },
}


export default function TemplateListModal({ open, onClose, variant }: Props) {
  const qc = useQueryClient()
  const meta = META[variant]
  const [edit, setEdit] = useState<{ open: boolean; template?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['cert-templates', meta.typeKey],
    queryFn:  () => certificatesApi.listTemplates({ template_type: meta.typeKey }).then(r => r.data),
    enabled:  open,
  })
  const templates: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => certificatesApi.deleteTemplate(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cert-templates'] }),
  })

  if (!open) return null

  return (
    <>
    <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center pt-12 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[760px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">{meta.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEdit({ open: true })}
              className="btn btn-primary flex items-center gap-1.5"
            >
              <Plus size={14}/> {variant === 'certificate' ? 'Add Certificate Template' : 'Add ' + (variant === 'patient_id' ? 'Patient' : 'Staff') + ' ID Card'}
            </button>
            <button onClick={onClose}><X size={18}/></button>
          </div>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">{variant === 'certificate' ? 'Certificate Template Name' : 'ID Card Title'}</th>
                <th className="px-3 py-2">{variant === 'certificate' ? '—' : 'Background Image'}</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : templates.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No templates yet</td></tr>
              ) : templates.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-teal-700">{t.name}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {variant === 'certificate' ? '—' : (
                      t.background_image ? (
                        <FileImage size={20} className="text-blue-500"/>
                      ) : '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button title="View" className="p-1 hover:bg-gray-100 rounded text-gray-600"><ListIcon size={14}/></button>
                      <button onClick={() => setEdit({ open: true, template: t })} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this template?')) del.mutate(t.id) }} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">Records: {templates.length}</p>
        </div>
      </div>
    </div>

    {variant === 'certificate' && (
      <CertificateTemplateModal
        open={edit.open}
        template={edit.template}
        onClose={() => setEdit({ open: false })}
      />
    )}
    {variant !== 'certificate' && (
      <IdCardTemplateModal
        open={edit.open}
        variant={variant === 'patient_id' ? 'patient' : 'staff'}
        template={edit.template}
        onClose={() => setEdit({ open: false })}
      />
    )}
    </>
  )
}
