// src/pages/calendar/AddHolidayModal.tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { calendarApi } from '@/api/calendar'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  event?: any
  onClose: () => void
  onSuccess: () => void
}

const EVENT_TYPES = ['Holiday', 'Activity', 'Vacation'] as const
type EventType = typeof EVENT_TYPES[number]

interface FormShape {
  event_type  : EventType | ''
  date_from   : string
  date_to     : string
  description : string
  front_site  : boolean
}

export default function AddHolidayModal({ open, event, onClose, onSuccess }: Props) {
  const [eventType, setEventType] = useState<EventType | ''>('')

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormShape>({
    defaultValues: {
      event_type : '', date_from: '', date_to: '',
      description: '', front_site: false,
    },
  })

  useEffect(() => {
    if (!open) return
    const t = (event?.event_type as EventType) ?? ''
    setEventType(t)
    reset({
      event_type : t,
      date_from  : event?.date_from ?? '',
      date_to    : event?.date_to   ?? '',
      description: event?.description ?? '',
      front_site : Boolean(event?.front_site),
    })
  }, [open, event, reset])

  const isRange = eventType === 'Vacation'
  const frontSite = watch('front_site')

  const mut = useMutation({
    mutationFn: (raw: FormShape) => {
      const payload = {
        event_type : raw.event_type,
        date_from  : raw.date_from,
        date_to    : isRange ? (raw.date_to || raw.date_from) : undefined,
        description: raw.description,
        front_site : Boolean(raw.front_site),
      }
      return event
        ? calendarApi.updateEvent(event.id, payload)
        : calendarApi.addEvent(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="md" title={event ? 'Edit Holiday' : 'Add Holiday'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="ac-event-form" type="submit" className="btn btn-primary" disabled={mut.isPending || !eventType}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="ac-event-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setEventType(t); setValue('event_type', t) }}
                className={cn(
                  'px-4 py-3 text-sm rounded border text-center transition',
                  eventType === t
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium ring-1 ring-emerald-300'
                    : 'border-gray-200 text-gray-700 hover:border-emerald-300'
                )}
              >{t}</button>
            ))}
          </div>
          <input type="hidden" {...register('event_type', { required: true })} />
        </div>

        <div className={cn('grid gap-3', isRange ? 'grid-cols-2' : 'grid-cols-1')}>
          <FormField label={isRange ? 'From Date' : 'Date'} required>
            <input type="date" className="input" {...register('date_from', { required: true })} />
          </FormField>
          {isRange && (
            <FormField label="To Date" required>
              <input type="date" className="input" {...register('date_to', { required: true })} />
            </FormField>
          )}
        </div>

        <FormField label="Description" required>
          <textarea className="input min-h-[100px]" {...register('description', { required: true })} />
        </FormField>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Front Site</label>
          <button
            type="button"
            onClick={() => setValue('front_site', !frontSite)}
            className={cn(
              'relative inline-flex h-5 w-10 items-center rounded-full transition',
              frontSite ? 'bg-emerald-500' : 'bg-gray-300'
            )}
            aria-pressed={frontSite}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition',
                frontSite ? 'translate-x-5' : 'translate-x-1'
              )}
            />
          </button>
          <input type="checkbox" hidden {...register('front_site')} />
        </div>
      </form>
    </Modal>
  )
}
