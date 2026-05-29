// src/pages/setup/custom_fields/CustomFieldsPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react'
import { customFieldsApi } from '@/api/customFields'

const TYPES_WITH_VALUES = new Set(['select', 'radio', 'checkbox'])


export default function CustomFieldsPage() {
  const [editing, setEditing] = useState<any | null>(null)

  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-5">
          <FieldForm editing={editing} onDone={() => setEditing(null)} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <FieldList onEdit={setEditing} />
        </div>
      </div>
    </div>
  )
}


// ── Left: Add/Edit form ──────────────────────────────────
function FieldForm({ editing, onDone }: { editing: any | null; onDone: () => void }) {
  const qc = useQueryClient()
  const isEditing = !!editing?.id

  const { data: entitiesData }   = useQuery({ queryKey: ['cf-entities'],    queryFn: () => customFieldsApi.listEntities().then(r => r.data) })
  const { data: fieldTypesData } = useQuery({ queryKey: ['cf-field-types'], queryFn: () => customFieldsApi.listFieldTypes().then(r => r.data) })
  const entities: any[]   = entitiesData?.data ?? []
  const fieldTypes: any[] = fieldTypesData?.data ?? []

  const [form, setForm] = useState({
    belongs_to: '', field_type: '', field_name: '',
    grid: '12', field_values: '',
    is_required: false,
    on_table: false, on_print: false, on_report: false, on_patient_panel: false,
  })

  useEffect(() => {
    if (editing?.id) {
      setForm({
        belongs_to       : editing.belongs_to ?? '',
        field_type       : editing.field_type ?? '',
        field_name       : editing.field_name ?? '',
        grid             : editing.grid != null ? String(editing.grid) : '12',
        field_values     : editing.field_values ?? '',
        is_required      : !!editing.is_required,
        on_table         : !!editing.on_table,
        on_print         : !!editing.on_print,
        on_report        : !!editing.on_report,
        on_patient_panel : !!editing.on_patient_panel,
      })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const reset = () => setForm({
    belongs_to: '', field_type: '', field_name: '',
    grid: '12', field_values: '',
    is_required: false,
    on_table: false, on_print: false, on_report: false, on_patient_panel: false,
  })

  const save = useMutation({
    mutationFn: (payload: any) => isEditing
      ? customFieldsApi.update(editing.id, payload)
      : customFieldsApi.add(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cf-grouped'] })
      onDone()
      reset()
    },
  })

  const showValues = TYPES_WITH_VALUES.has(form.field_type)

  return (
    <div className="card">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          {isEditing ? 'Edit Custom Field' : 'Add Custom Field'}
        </h2>
        {isEditing && (
          <button onClick={() => { onDone(); reset() }}
            className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
        )}
      </div>
      <form className="p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.belongs_to || !form.field_type || !form.field_name.trim()) return
          const grid = Math.max(1, Math.min(12, parseInt(form.grid || '12', 10) || 12))
          save.mutate({
            belongs_to       : form.belongs_to,
            field_type       : form.field_type,
            field_name       : form.field_name.trim(),
            grid,
            field_values     : showValues ? (form.field_values || null) : null,
            is_required      : form.is_required,
            on_table         : form.on_table,
            on_print         : form.on_print,
            on_report        : form.on_report,
            on_patient_panel : form.on_patient_panel,
          })
        }}
      >
        <Field label="Field Belongs To" required>
          <select required value={form.belongs_to}
            onChange={e => setForm({ ...form, belongs_to: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {entities.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </Field>
        <Field label="Field Type" required>
          <select required value={form.field_type}
            onChange={e => setForm({ ...form, field_type: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {fieldTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Field Name" required>
          <input required value={form.field_name}
            onChange={e => setForm({ ...form, field_name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Grid (Bootstrap Column e.g. 6) - Max is 12">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <input disabled value="col-md-" className="input bg-gray-50 text-center"/>
            <input type="number" min="1" max="12" value={form.grid}
              onChange={e => setForm({ ...form, grid: e.target.value })}
              className="input w-full"/>
          </div>
        </Field>
        {showValues && (
          <Field label="Field Values (Separate By Comma)">
            <input value={form.field_values}
              onChange={e => setForm({ ...form, field_values: e.target.value })}
              placeholder="Option 1, Option 2, Option 3"
              className="input w-full"/>
          </Field>
        )}
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Validation</div>
          <label className="flex items-center gap-1.5 text-sm text-gray-700">
            <input type="checkbox" className="w-4 h-4 accent-emerald-600"
              checked={form.is_required}
              onChange={e => setForm({ ...form, is_required: e.target.checked })}/>
            Required
          </label>
        </div>
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Visibility</div>
          <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
            {[
              { k: 'on_table',        label: 'On Table' },
              { k: 'on_print',        label: 'On Print' },
              { k: 'on_report',       label: 'On Report' },
              { k: 'on_patient_panel',label: 'On Patient Panel' },
            ].map(v => (
              <label key={v.k} className="flex items-center gap-1.5">
                <input type="checkbox" className="w-4 h-4 accent-emerald-600"
                  checked={(form as any)[v.k]}
                  onChange={e => setForm({ ...form, [v.k]: e.target.checked })}/>
                {v.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button type="submit" disabled={save.isPending} className="btn btn-primary">
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}


// ── Right: Accordion list grouped by entity ───────────────
function FieldList({ onEdit }: { onEdit: (item: any) => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['cf-grouped'],
    queryFn:  () => customFieldsApi.listGrouped().then(r => r.data),
  })
  const sections: any[] = data?.data?.entities ?? []

  const [openKey, setOpenKey] = useState<string | null>(null)

  const del = useMutation({
    mutationFn: (id: number) => customFieldsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cf-grouped'] }),
  })

  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Custom Field List</h2>
      </div>
      <div className="divide-y">
        {isLoading
          ? <div className="px-5 py-6 text-center text-gray-400 text-sm">Loading…</div>
          : sections.map(sec => {
              const open  = openKey === sec.key
              const count = sec.fields?.length ?? 0
              return (
                <div key={sec.key}>
                  <button
                    onClick={() => setOpenKey(open ? null : sec.key)}
                    className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold tracking-wide text-gray-700 uppercase hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                      {sec.label}
                      {count > 0 && (
                        <span className="ml-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {count}
                        </span>
                      )}
                    </span>
                    <span className="text-emerald-600"><Plus size={16}/></span>
                  </button>
                  {open && (
                    <div className="px-5 pb-4">
                      {count === 0
                        ? <p className="text-xs text-gray-400 py-2">No custom fields yet for this entity.</p>
                        : (
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs text-gray-600">
                              <tr>
                                <th className="px-3 py-2">Field Name</th>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Grid</th>
                                <th className="px-3 py-2">Required</th>
                                <th className="px-3 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sec.fields.map((f: any) => (
                                <tr key={f.id} className="border-t hover:bg-gray-50">
                                  <td className="px-3 py-2 text-emerald-700">{f.field_name}</td>
                                  <td className="px-3 py-2 text-gray-700">{f.field_type}</td>
                                  <td className="px-3 py-2 text-gray-700">col-md-{f.grid}</td>
                                  <td className="px-3 py-2 text-gray-700">{f.is_required ? 'Yes' : 'No'}</td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => onEdit(f)}
                                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                                      <button onClick={() => { if (confirm('Delete?')) del.mutate(f.id) }}
                                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      }
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>
    </div>
  )
}


function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
