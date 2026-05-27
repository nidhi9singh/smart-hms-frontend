// src/pages/certificates/StaffIdCardPage.tsx
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, Contact as IdCard } from 'lucide-react'
import { certificatesApi } from '@/api/certificates'
import TemplateListModal from './TemplateListModal'
import GeneratedPreview from './GeneratedPreview'

const ROLES = ['doctor', 'nurse', 'pharmacist', 'receptionist', 'accountant', 'lab', 'admin']

export default function StaffIdCardPage() {
  const [role, setRole] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('')
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [tplOpen, setTplOpen] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  const { data: tplData } = useQuery({
    queryKey: ['cert-templates', 'staff_id'],
    queryFn:  () => certificatesApi.listTemplates({ template_type: 'staff_id' }).then(r => r.data),
  })
  const templates: any[] = tplData?.data ?? []

  const { data: sData, isFetching } = useQuery({
    queryKey: ['cert-staff', searched, role],
    queryFn:  () => certificatesApi.listStaff({ role: role || undefined }).then(r => r.data),
    enabled:  searched,
  })
  const staff: any[] = sData?.data ?? []

  const allChecked = staff.length > 0 && staff.every(s => selected.has(s.id))
  const toggle = (id: number) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => allChecked ? setSelected(new Set()) : setSelected(new Set(staff.map(s => s.id)))

  const gen = useMutation({
    mutationFn: () => certificatesApi.generateStaffIdCard({
      template_id: Number(templateId),
      staff_ids  : Array.from(selected),
    }),
    onSuccess: r => setPreview(r.data?.data),
  })

  const canGenerate = templateId && selected.size > 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Staff ID Card</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate staff identity cards</p>
        </div>
        <button onClick={() => setTplOpen(true)} className="btn btn-outline flex items-center gap-1.5">
          <IdCard size={14}/> ID Card Template
        </button>
      </div>

      <form onSubmit={e => { e.preventDefault(); setSearched(true) }} className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Select Criteria</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select required value={role}
              onChange={e => setRole(e.target.value)} className="input w-full">
              <option value="">Select</option>
              {ROLES.map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ID Card Template <span className="text-red-500">*</span>
            </label>
            <select required value={templateId}
              onChange={e => setTemplateId(e.target.value)} className="input w-full">
              <option value="">Select</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary flex items-center gap-1.5">
            <Search size={14}/> Search
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-800">Staff List</h3>
          <button disabled={!canGenerate} onClick={() => gen.mutate()}
            className="btn btn-primary disabled:opacity-50">
            {gen.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2 w-8"><input type="checkbox" checked={allChecked} onChange={toggleAll}/></th>
                <th className="px-3 py-2">Staff ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Father Name</th>
                <th className="px-3 py-2">Mother Name</th>
                <th className="px-3 py-2">Date Of Joining</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2 text-right">Date Of Birth</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">← Add new record or search with different criteria.</td></tr>
              ) : isFetching ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}/>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{s.staff_code}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                  <td className="px-3 py-2 text-gray-600">{s.designation || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.department || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.father_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.mother_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.date_of_joining || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{s.date_of_birth || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 px-5 py-2">Records: {staff.length}</p>
      </div>

      <TemplateListModal open={tplOpen} onClose={() => setTplOpen(false)} variant="staff_id" />
      <GeneratedPreview  open={!!preview} onClose={() => setPreview(null)} payload={preview} />
    </div>
  )
}
