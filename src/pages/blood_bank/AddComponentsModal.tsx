// src/pages/blood_bank/AddComponentsModal.tsx
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bloodBankApi } from '@/api/blood_bank'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  defaultBloodGroup?: string
  onClose: () => void
  onSuccess: () => void
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const COMPONENTS   = ['Platelets', 'Plasma', 'Cryo.', 'White Cells & Granulocytes', 'Red Cells', 'Cryo']
const UNITS        = ['ML', 'g/dl', 'Litter', 'per day', 'Hour']

interface RowForm {
  enabled     : boolean
  component_type : string
  bag_no      : string
  volume_ml   : number
  volume_unit : string
  lot_no      : number | ''
  institution : string
}

interface FormShape {
  blood_group   : string
  parent_bag_id : number | ''
  rows          : RowForm[]
}

export default function AddComponentsModal({ open, defaultBloodGroup, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, control, reset, watch } = useForm<FormShape>({
    defaultValues: {
      blood_group: defaultBloodGroup || '', parent_bag_id: '',
      rows: COMPONENTS.map(c => ({
        enabled: false, component_type: c, bag_no: '', volume_ml: 0,
        volume_unit: 'ML', lot_no: '', institution: '',
      })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'rows' })

  useEffect(() => {
    if (open) reset({
      blood_group: defaultBloodGroup || '', parent_bag_id: '',
      rows: COMPONENTS.map(c => ({
        enabled: false, component_type: c, bag_no: '', volume_ml: 0,
        volume_unit: 'ML', lot_no: '', institution: '',
      })),
    })
  }, [open, defaultBloodGroup, reset])

  const bloodGroup = watch('blood_group')

  const { data: stockData } = useQuery({
    queryKey: ['bb-stock-for-components', bloodGroup],
    queryFn: () => bloodBankApi.listStock({ blood_group: bloodGroup, available_only: false }).then(r => r.data),
    enabled: open && !!bloodGroup,
  })
  const bags: any[] = stockData?.data ?? []

  const mut = useMutation({
    mutationFn: (raw: FormShape) => {
      const rows = raw.rows
        .filter(r => r.enabled && r.bag_no.trim())
        .map(r => ({
          component_type: r.component_type,
          bag_no        : r.bag_no,
          volume_ml     : Number(r.volume_ml) || 0,
          volume_unit   : r.volume_unit || 'ML',
          lot_no        : r.lot_no ? Number(r.lot_no) : undefined,
          institution   : r.institution || undefined,
        }))
      if (rows.length === 0) {
        throw new Error('Tick at least one component and fill its Bag number')
      }
      return bloodBankApi.addComponentsBulk({
        blood_group  : raw.blood_group,
        parent_bag_id: raw.parent_bag_id ? Number(raw.parent_bag_id) : undefined,
        rows,
      }).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Components added')
      qc.invalidateQueries({ queryKey: ['bb-comps'] })
      qc.invalidateQueries({ queryKey: ['bb-stock'] })
      onSuccess()
    },
    onError: (e: any) => {
      const d = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Failed to add components'
      toast.error(typeof d === 'string' ? d : JSON.stringify(d))
    },
  })

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Add Components"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="bb-comp-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="bb-comp-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Blood Group" required>
            <select className="input" {...register('blood_group', { required: true })}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Bag (parent)" required>
            <select className="input" {...register('parent_bag_id')}>
              <option value="">Select</option>
              {bags.map(b => <option key={b.id} value={b.id}>{b.bag_no} ({b.volume_ml} {b.volume_unit})</option>)}
            </select>
          </FormField>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.7fr_1fr] gap-2 text-[10px] font-semibold text-gray-500 px-1 mb-2">
            <span>Components Name *</span>
            <span>Bag *</span>
            <span>Volume</span>
            <span>Unit</span>
            <span>Lot *</span>
            <span>Institution</span>
          </div>
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.7fr_1fr] gap-2 items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register(`rows.${idx}.enabled` as const)} />
                  {f.component_type}
                </label>
                <input className="input text-xs h-8" {...register(`rows.${idx}.bag_no` as const)} />
                <input type="text" inputMode="decimal" className="input text-xs h-8" {...register(`rows.${idx}.volume_ml` as const)} />
                <select className="input text-xs h-8" {...register(`rows.${idx}.volume_unit` as const)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="number" className="input text-xs h-8" {...register(`rows.${idx}.lot_no` as const, { valueAsNumber: true })} />
                <input className="input text-xs h-8" {...register(`rows.${idx}.institution` as const)} />
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
