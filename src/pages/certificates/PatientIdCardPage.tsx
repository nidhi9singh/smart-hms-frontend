// src/pages/certificates/PatientIdCardPage.tsx
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, Contact as IdCard } from 'lucide-react'
import { certificatesApi } from '@/api/certificates'
import TemplateListModal from './TemplateListModal'
import GeneratedPreview from './GeneratedPreview'

export default function PatientIdCardPage() {
  const [patientFilter, setPatientFilter] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('')
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [tplOpen, setTplOpen] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  const { data: tplData } = useQuery({
    queryKey: ['cert-templates', 'patient_id'],
    queryFn:  () => certificatesApi.listTemplates({ template_type: 'patient_id' }).then(r => r.data),
  })
  const templates: any[] = tplData?.data ?? []

  const { data: pData, isFetching } = useQuery({
    queryKey: ['cert-patients-all', searched, patientFilter],
    queryFn:  () => certificatesApi.listPatients({ search: patientFilter || undefined }).then(r => r.data),
    enabled:  searched,
  })
  const patients: any[] = pData?.data ?? []

  const allChecked = patients.length > 0 && patients.every(p => selected.has(p.id))
  const toggle = (id: number) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => allChecked ? setSelected(new Set()) : setSelected(new Set(patients.map(p => p.id)))

  const gen = useMutation({
    mutationFn: () => certificatesApi.generatePatientIdCard({
      template_id: Number(templateId),
      patient_ids: Array.from(selected),
    }),
    onSuccess: r => setPreview(r.data?.data),
  })

  const canGenerate = templateId && selected.size > 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Patient ID Card</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate patient identity cards</p>
        </div>
        <button onClick={() => setTplOpen(true)} className="btn btn-outline flex items-center gap-1.5">
          <IdCard size={14}/> ID Card Template
        </button>
      </div>

      <form onSubmit={e => { e.preventDefault(); setSearched(true) }} className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Select Criteria</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Patient</label>
            <input value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              placeholder="All / search by name"
              className="input w-full"/>
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
          <h3 className="text-sm font-semibold text-gray-800">Patient List</h3>
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
                <th className="px-3 py-2">Patient Name</th>
                <th className="px-3 py-2">Age</th>
                <th className="px-3 py-2">Gender</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Guardian Name</th>
                <th className="px-3 py-2 text-right">Address</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">← Add new record or search with different criteria.</td></tr>
              ) : isFetching ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              ) : patients.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}/>
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                  <td className="px-3 py-2 text-gray-600">—</td>
                  <td className="px-3 py-2 text-gray-600">{p.gender}</td>
                  <td className="px-3 py-2 text-gray-600">{p.phone || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">—</td>
                  <td className="px-3 py-2 text-right text-gray-600">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 px-5 py-2">Records: {patients.length}</p>
      </div>

      <TemplateListModal open={tplOpen} onClose={() => setTplOpen(false)} variant="patient_id" />
      <GeneratedPreview  open={!!preview} onClose={() => setPreview(null)} payload={preview} />
    </div>
  )
}
