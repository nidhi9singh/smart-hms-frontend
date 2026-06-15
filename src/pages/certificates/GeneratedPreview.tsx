// src/pages/certificates/GeneratedPreview.tsx
import { X, Printer } from 'lucide-react'
import api from '@/lib/axios'

type Props = {
  open: boolean
  onClose: () => void
  payload: any
}

function fillTemplate(text: string, data: Record<string, any>): string {
  if (!text) return ''
  return text.replace(/\[([a-z_]+)\]/g, (_, k) => (data[k] ?? '').toString())
}

function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const base = (api.defaults?.baseURL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/,'')
  return `${base}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`
}


export default function GeneratedPreview({ open, onClose, payload }: Props) {
  if (!open || !payload) return null

  const template = payload.template
  const items    = payload.items ?? []
  const type     = template?.template_type
  const cfg      = template?.config || {}

  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-6 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[860px] max-w-[96vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b print:hidden">
          <h2 className="text-base font-semibold text-gray-800">Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn btn-outline flex items-center gap-1.5">
              <Printer size={14}/> Print
            </button>
            <button onClick={onClose}><X size={18}/></button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {items.length === 0 && (
            <div className="text-center text-gray-400 py-10">No items rendered.</div>
          )}

          {items.map((data: any, i: number) => {
            if (type === 'patient_id' || type === 'staff_id') {
              return (
                <IdCardRender key={i} data={data} cfg={cfg} variant={type === 'staff_id' ? 'staff' : 'patient'} />
              )
            }
            // patient_certificate
            return (
              <CertificateRender key={i} data={data} cfg={cfg} template={template} />
            )
          })}
        </div>
      </div>
    </div>
  )
}


function CertificateRender({ data, cfg, template }: { data: any; cfg: any; template: any }) {
  const body = fillTemplate(template?.content || '', data)
  return (
    <div className="border border-gray-300 p-6 bg-white" style={{ minHeight: cfg.body_height || 600 }}>
      <div className="flex items-start justify-between border-b pb-3" style={{ minHeight: cfg.header_height || 60 }}>
        <div className="text-sm whitespace-pre-wrap">{cfg.header_left}</div>
        <div className="text-sm font-semibold text-center whitespace-pre-wrap">{cfg.header_center}</div>
        <div className="text-sm whitespace-pre-wrap">{cfg.header_right}</div>
      </div>

      <div className="flex gap-4 py-6">
        {cfg.patient_photo && data.photo_path && (
          <img src={assetUrl(data.photo_path) ?? ''} alt="patient"
               className="w-24 h-32 object-cover border" />
        )}
        <p className="flex-1 text-sm whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>

      <div className="flex items-end justify-between border-t pt-3 mt-auto" style={{ minHeight: cfg.footer_height || 60 }}>
        <div className="text-xs whitespace-pre-wrap">{cfg.footer_left}</div>
        <div className="text-xs text-center whitespace-pre-wrap">{cfg.footer_center}</div>
        <div className="text-xs text-right whitespace-pre-wrap">{cfg.footer_right}</div>
      </div>
    </div>
  )
}


function IdCardRender({
  data, cfg, variant,
}: { data: any; cfg: any; variant: 'patient' | 'staff' }) {
  const fields = cfg.fields || {}
  const bg = assetUrl(cfg.background_image)
  const logo = assetUrl(cfg.logo)
  const signature = assetUrl(cfg.signature)

  const rows: Array<[string, any]> = variant === 'patient'
    ? [
        ['Patient Name',  fields.patient_name    ? data.patient_name    : null],
        ['Patient Id',    fields.patient_id      ? data.patient_id      : null],
        ['Guardian Name', fields.guardian_name   ? data.guardian_name   : null],
        ['Address',       fields.patient_address ? data.address         : null],
        ['Phone',         fields.phone           ? data.phone           : null],
        ['DOB',           fields.date_of_birth   ? data.dob             : null],
        ['Blood Group',   fields.blood_group     ? data.blood_group     : null],
      ]
    : [
        ['Name',            fields.name            ? data.name            : null],
        ['Staff ID',        fields.staff_id        ? data.staff_id        : null],
        ['Designation',     fields.designation     ? data.designation     : null],
        ['Department',      fields.department      ? data.department      : null],
        ['Father Name',     fields.father_name     ? data.father_name     : null],
        ['Mother Name',     fields.mother_name     ? data.mother_name     : null],
        ['Date Of Joining', fields.date_of_joining ? data.date_of_joining : null],
        ['Current Address', fields.current_address ? data.address         : null],
        ['Phone',           fields.phone           ? data.phone           : null],
        ['DOB',             fields.date_of_birth   ? data.date_of_birth   : null],
      ]

  return (
    <div className="border border-gray-300 inline-block" style={{ width: 380 }}>
      <div className="px-3 py-2 text-white flex items-center gap-2" style={{ background: cfg.header_color || '#47C0BD' }}>
        {logo && <img src={logo} alt="logo" className="w-8 h-8 object-contain bg-white rounded-sm p-0.5"/>}
        <div className="flex-1">
          <p className="text-sm font-bold leading-tight">{cfg.hospital_name}</p>
          <p className="text-[10px] leading-tight opacity-90">{cfg.address}</p>
        </div>
      </div>

      <p className="text-center text-xs font-semibold py-1 border-b bg-gray-50">{cfg.id_card_title}</p>

      <div className="p-3 relative" style={{
        backgroundImage: bg ? `url(${bg})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <table className="text-xs w-full bg-white/80">
          <tbody>
            {rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => (
              <tr key={k} className="border-b last:border-b-0">
                <td className="py-1 px-2 font-medium text-gray-600 w-1/3">{k}</td>
                <td className="py-1 px-2 text-gray-800">{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {fields.barcode && (
          <div className="mt-3 flex items-center justify-center">
            <div className="font-mono text-[10px] tracking-[0.3em] bg-white px-2 py-1">
              || ||| | ||| | || |||
            </div>
          </div>
        )}

        {signature && (
          <div className="mt-2 flex items-end justify-end">
            <img src={signature} alt="sig" className="h-10 object-contain"/>
          </div>
        )}
      </div>
    </div>
  )
}
