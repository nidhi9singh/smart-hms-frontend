// src/pages/setup/zoom/ZoomSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { zoomSetupApi } from '@/api/zoomSetup'

const DEFAULTS = {
  api_key                  : '',
  api_secret               : '',
  doctor_credential_enabled: 'true',
  zoom_client_app_enabled  : 'true',
  default_opd_duration     : '45',
  default_ipd_duration     : '35',
  access_token             : '',
}

const REDIRECT_PATH = '/admin/zoom_conference/generatetoken'


export default function ZoomSetupPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ ...DEFAULTS })

  const { data, isLoading } = useQuery({
    queryKey: ['zoom-settings'],
    queryFn:  () => zoomSetupApi.get().then(r => r.data),
  })

  useEffect(() => {
    const incoming = data?.data ?? {}
    setForm({
      ...DEFAULTS,
      ...incoming,
      // booleans stored as text in app_settings — coerce to string for radios
      doctor_credential_enabled: String(incoming.doctor_credential_enabled ?? 'true'),
      zoom_client_app_enabled  : String(incoming.zoom_client_app_enabled   ?? 'true'),
    })
  }, [data])

  const save = useMutation({
    mutationFn: (payload: any) => zoomSetupApi.save(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zoom-settings'] }),
  })

  const redirectUrl = `${window.location.origin}${REDIRECT_PATH}`
  const hasToken    = !!form.access_token

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    save.mutate({
      api_key                  : form.api_key,
      api_secret               : form.api_secret,
      doctor_credential_enabled: form.doctor_credential_enabled,
      zoom_client_app_enabled  : form.zoom_client_app_enabled,
      default_opd_duration     : form.default_opd_duration,
      default_ipd_duration     : form.default_ipd_duration,
    })
  }

  return (
    <div className="p-6">
      <div className="card">
        <div className="px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">Settings</h2>
        </div>

        {!hasToken && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 text-emerald-800 text-sm rounded flex items-center gap-2">
            <Info size={16}/>
            Access Token not generated, Please authenticate your Account.
          </div>
        )}

        <form onSubmit={onSubmit} className="p-5 grid grid-cols-12 gap-6">
          {/* Left: form fields */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <Row label="Zoom Api Key">
              <input value={form.api_key}
                onChange={e => setForm({ ...form, api_key: e.target.value })}
                className="input w-full"/>
            </Row>
            <Row label="Zoom Api Secret">
              <input value={form.api_secret}
                onChange={e => setForm({ ...form, api_secret: e.target.value })}
                className="input w-full"/>
            </Row>
            <Row label="Doctor Api Credential">
              <RadioPair name="doctor_credential_enabled"
                value={form.doctor_credential_enabled}
                onChange={v => setForm({ ...form, doctor_credential_enabled: v })}/>
            </Row>
            <Row label="Use Zoom Client App">
              <RadioPair name="zoom_client_app_enabled"
                value={form.zoom_client_app_enabled}
                onChange={v => setForm({ ...form, zoom_client_app_enabled: v })}/>
            </Row>
            <Row label="Default OPD Duration (In Minutes)">
              <input type="number" min="1" value={form.default_opd_duration}
                onChange={e => setForm({ ...form, default_opd_duration: e.target.value })}
                className="input w-full"/>
            </Row>
            <Row label="Default IPD Duration (In Minutes)">
              <input type="number" min="1" value={form.default_ipd_duration}
                onChange={e => setForm({ ...form, default_ipd_duration: e.target.value })}
                className="input w-full"/>
            </Row>
          </div>

          {/* Right: Zoom branding panel */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:pl-6 lg:border-l">
            <div className="text-4xl font-bold text-emerald-600 tracking-tight">zoom</div>
            <p className="text-sm text-gray-700">
              To set zoom api{' '}
              <a href="https://marketplace.zoom.us/develop/create" target="_blank" rel="noreferrer"
                 className="text-emerald-700 font-medium hover:underline">Click here</a>
            </p>
            <div className="text-sm text-gray-700">
              <div className="font-medium">Set Zoom Redirect URL:</div>
              <div className="text-xs break-all text-gray-600 mt-0.5">{redirectUrl}</div>
            </div>
            <button type="button"
              onClick={() => alert('Zoom OAuth flow not configured. Provide API Key & Secret, then save.')}
              className="btn btn-primary w-fit">
              Get Access Token
            </button>
          </div>

          <div className="col-span-12 flex justify-center pt-4 border-t">
            <button type="submit" disabled={save.isPending || isLoading}
              className="btn btn-primary px-6">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3">
      <label className="col-span-4 text-sm text-gray-700 text-right pr-2">{label}</label>
      <div className="col-span-8">{children}</div>
    </div>
  )
}

function RadioPair({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-6 text-sm text-gray-700">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" name={name} checked={value === 'false'} onChange={() => onChange('false')}
          className="accent-emerald-600"/>
        Disabled
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" name={name} checked={value === 'true'} onChange={() => onChange('true')}
          className="accent-emerald-600"/>
        Enabled
      </label>
    </div>
  )
}
