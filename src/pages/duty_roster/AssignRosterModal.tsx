// src/pages/duty_roster/AssignRosterModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { dutyRosterApi } from '@/api/duty_roster'
import { hrApi } from '@/api/hr'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormShape {
  roster_id  : number | ''
  staff_id   : number | ''
  floor      : string
  department : string
}

export default function AssignRosterModal({ open, onClose, onSuccess }: Props) {
  const [selectedShift, setSelectedShift] = useState<number | null>(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormShape>({
    defaultValues: { roster_id: '', staff_id: '', floor: '', department: '' },
  })

  useEffect(() => {
    if (open) {
      reset()
      setSelectedShift(null)
    }
  }, [open, reset])

  const { data: shiftsData } = useQuery({
    queryKey: ['dr-shifts'], queryFn: () => dutyRosterApi.listShifts().then(r => r.data), enabled: open,
  })
  const shifts: any[] = shiftsData?.data ?? []

  const { data: rostersData } = useQuery({
    queryKey: ['dr-rosters'], queryFn: () => dutyRosterApi.listRosters().then(r => r.data), enabled: open,
  })
  const rosters: any[] = rostersData?.data ?? []

  const { data: staffData } = useQuery({
    queryKey: ['dr-staff'], queryFn: () => hrApi.listStaff({ per_page: 500 }).then(r => r.data), enabled: open,
  })
  const staff: any[] = staffData?.data ?? []

  // Rosters available for the picked shift
  const rosterChoices = useMemo(
    () => selectedShift ? rosters.filter(r => r.shift_id === selectedShift) : [],
    [rosters, selectedShift],
  )

  // Reset roster when shift changes
  useEffect(() => {
    setValue('roster_id', '')
  }, [selectedShift, setValue])

  const mut = useMutation({
    mutationFn: (raw: FormShape) => dutyRosterApi.assignRoster({
      roster_id : Number(raw.roster_id),
      staff_id  : Number(raw.staff_id),
      floor     : raw.floor || undefined,
      department: raw.department || undefined,
    }),
    onSuccess,
  })

  // Show 6 shift cards in a grid (fall back to whatever shifts exist)
  const shiftCards = shifts.slice(0, 6)

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Assign Roster"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="dr-assign-form" type="submit" className="btn btn-primary"
                  disabled={mut.isPending || !watch('roster_id') || !watch('staff_id')}>
            {mut.isPending ? 'Assigning…' : 'Save'}
          </button>
        </div>
      }>
      <form id="dr-assign-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">Shift</div>
          {shiftCards.length === 0 ? (
            <div className="text-sm text-gray-400 p-3 border border-dashed border-gray-200 rounded">
              No shifts yet. Add a shift first.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {shiftCards.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedShift(s.id)}
                  className={cn(
                    'text-left p-3 border rounded transition',
                    selectedShift === s.id
                      ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-300'
                      : 'border-gray-200 hover:border-teal-300'
                  )}
                >
                  <div className="text-sm font-medium text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.start_time} - {s.end_time}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <FormField label="Shift Date" required>
          <select className="input" {...register('roster_id', { required: true })} disabled={!selectedShift}>
            <option value="">{selectedShift ? 'Select a roster' : 'Pick a shift first'}</option>
            {rosterChoices.map(r => (
              <option key={r.id} value={r.id}>
                {r.start_date} - {r.end_date} ({r.roster_days} days)
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Staff" required>
          <select className="input" {...register('staff_id', { required: true })}>
            <option value="">Select</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {[s.first_name, s.last_name].filter(Boolean).join(' ')} {s.staff_code ? `(${s.staff_code})` : ''}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Floor">
            <input className="input" placeholder="e.g. 2nd Floor" {...register('floor')} />
          </FormField>
          <FormField label="Department">
            <input className="input" placeholder="e.g. IPD Department" {...register('department')} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
