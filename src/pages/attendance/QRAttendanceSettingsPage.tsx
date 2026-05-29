// src/pages/attendance/QRAttendanceSettingsPage.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { qrAttendanceApi } from '@/api/qr_attendance'

export default function QRAttendanceSettingsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: settingsData } = useQuery({
    queryKey: ['qr-settings'],
    queryFn:  () => qrAttendanceApi.getSettings().then(r => r.data),
  })
  const settings = settingsData?.data ?? { auto_attendance: true, camera: 'primary' }

  const { register, handleSubmit, reset } = useForm<{ auto_attendance: string; camera: string }>({
    defaultValues: {
      auto_attendance: settings.auto_attendance ? 'enabled' : 'disabled',
      camera         : settings.camera === 'secondary' ? 'secondary' : 'primary',
    },
  })

  useEffect(() => {
    reset({
      auto_attendance: settings.auto_attendance ? 'enabled' : 'disabled',
      camera         : settings.camera === 'secondary' ? 'secondary' : 'primary',
    })
  }, [settings, reset])

  const mut = useMutation({
    mutationFn: (d: { auto_attendance: string; camera: string }) => qrAttendanceApi.updateSettings({
      auto_attendance: d.auto_attendance === 'enabled',
      camera         : d.camera,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr-settings'] }),
  })

  return (
    <div className="p-6">
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Settings</h2>
          <button onClick={() => navigate('/attendance')}
                  className="btn btn-outline text-sm flex items-center gap-1.5">
            <ScanLine size={13}/> Back to Scanner
          </button>
        </div>
        <form onSubmit={handleSubmit(d => mut.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Auto Attendance<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" value="disabled" {...register('auto_attendance')} /> Disabled
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="enabled" {...register('auto_attendance')} /> Enabled
              </label>
            </div>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Select Camera<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" value="primary" {...register('camera')} /> Primary (Back)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="secondary" {...register('camera')} /> Secondary (Front)
              </label>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button type="submit" disabled={mut.isPending} className="btn btn-primary px-8">
              {mut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
          {mut.isSuccess && <p className="text-center text-xs text-emerald-600">Settings saved.</p>}
        </form>
      </div>
    </div>
  )
}
