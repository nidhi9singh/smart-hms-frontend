// src/pages/attendance/QRAttendancePage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Settings, Maximize2, CheckCircle2, XCircle } from 'lucide-react'
import { qrAttendanceApi } from '@/api/qr_attendance'

interface ScanResult {
  staff_code : string
  status     : 'success' | 'failed'
  at         : string
}

export default function QRAttendancePage() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState<ScanResult[]>([])
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scannerReady, setScannerReady] = useState(false)

  const scannerRef = useRef<any>(null)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  const { data: settingsData } = useQuery({
    queryKey: ['qr-settings'],
    queryFn:  () => qrAttendanceApi.getSettings().then(r => r.data),
    retry: 0,
  })
  const camera = settingsData?.data?.camera === 'secondary' ? 'secondary' : 'primary'

  const scan = useMutation({
    mutationFn: (staff_code: string) => qrAttendanceApi.scan({ staff_code, scan_type: 'in' }),
    onSuccess: (res) => {
      const d: any = res.data?.data
      const newResult: ScanResult = {
        staff_code: d?.staff_code ?? '-',
        status:     d?.status === 'success' ? 'success' : 'failed',
        at:         new Date().toLocaleTimeString(),
      }
      setRecent(prev => [newResult, ...prev].slice(0, 5))
    },
    onError: () => {
      setRecent(prev => [{
        staff_code: lastScanRef.current.code, status: 'failed' as const,
        at: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 5))
    },
  })

  // Initialize the scanner lazily *after* the page has rendered. Doing this
  // inside a setTimeout guarantees the #qr-reader div is in the DOM and that
  // any failure in html5-qrcode (missing camera, denied permission) can never
  // blank the React tree.
  useEffect(() => {
    let cancelled = false
    let scanner: any = null

    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return
        const el = document.getElementById('qr-reader')
        if (!el) {
          setScannerError('Scanner container not found')
          return
        }
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        const facingMode = camera === 'secondary' ? 'user' : 'environment'
        await scanner.start(
          { facingMode },
          { fps: 10, qrbox: 280 },
          (decodedText: string) => {
            const now = Date.now()
            if (lastScanRef.current.code === decodedText && now - lastScanRef.current.at < 3000) return
            lastScanRef.current = { code: decodedText, at: now }
            scan.mutate(decodedText)
          },
          () => {},
        )
        if (!cancelled) setScannerReady(true)
      } catch (e: any) {
        if (!cancelled) {
          setScannerError(String(e?.message ?? e ?? 'Failed to start camera'))
        }
      }
    }

    // Defer to next tick so the DOM is mounted before we touch it
    const timer = setTimeout(init, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      const s = scannerRef.current
      if (s) {
        try { s.stop().then(() => { try { s.clear() } catch {} }).catch(() => {}) } catch {}
        scannerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera])

  return (
    <div className="p-6">
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">QR Code Attendance</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/attendance/settings')}
              className="icon-btn"
              title="Settings"
            ><Settings size={14}/></button>
            <button type="button" className="icon-btn" title="Fullscreen">
              <Maximize2 size={14}/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4">
          {/* Camera scanner card */}
          <div className="border border-gray-100 rounded">
            <div className="border-b border-gray-100 px-4 py-2 text-center bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Scan Your ID Card QR Code / Barcode</h3>
            </div>
            <div className="relative bg-black min-h-[360px] flex items-center justify-center">
              <div id="qr-reader" className="w-full max-w-md aspect-square" />
              {!scannerReady && !scannerError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-xs text-gray-300">Starting camera…</div>
                </div>
              )}
              {scannerError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-gray-50">
                  <div>
                    <XCircle size={32} className="mx-auto text-red-400 mb-2"/>
                    <p className="text-sm text-red-600 font-medium">Camera unavailable</p>
                    <p className="text-xs text-gray-500 mt-1 break-words max-w-xs">{scannerError}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Browsers only allow camera access on <code>localhost</code> or HTTPS.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ID card illustration */}
          <div className="border border-gray-100 rounded flex items-center justify-center p-8 bg-white">
            <IDCardIllustration />
          </div>
        </div>

        {/* Floating recent-scan feedback */}
        {recent.length > 0 && (
          <div className="fixed bottom-6 right-6 space-y-2 z-50">
            {recent.slice(0, 3).map((r, i) => (
              <div
                key={`${r.at}-${i}`}
                className={
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm bg-white border ' +
                  (r.status === 'success' ? 'border-emerald-200' : 'border-red-200')
                }
              >
                {r.status === 'success'
                  ? <CheckCircle2 size={16} className="text-emerald-500"/>
                  : <XCircle size={16} className="text-red-400"/>}
                <span className="font-mono text-xs">{r.staff_code}</span>
                <span className="text-xs text-gray-400">at {r.at}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IDCardIllustration() {
  return (
    <svg viewBox="0 0 256 256" className="w-64 h-64 text-gray-800" aria-hidden="true">
      <rect x="40" y="60" width="176" height="136" rx="6" fill="none" stroke="currentColor" strokeWidth="8"/>
      <rect x="118" y="28" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="6"/>
      <circle cx="128" cy="46" r="5" fill="currentColor"/>
      <line x1="128" y1="50" x2="128" y2="60" stroke="currentColor" strokeWidth="8"/>
      <circle cx="86" cy="108" r="18" fill="none" stroke="currentColor" strokeWidth="8"/>
      <path d="M58 158 Q86 134 114 158" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
      <line x1="140" y1="92"  x2="200" y2="92"  stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
      <line x1="140" y1="110" x2="200" y2="110" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
      <line x1="140" y1="128" x2="180" y2="128" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
      <rect x="155" y="148" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="6"/>
      <rect x="160" y="153" width="9" height="9" fill="currentColor"/>
      <rect x="176" y="153" width="9" height="9" fill="currentColor"/>
      <rect x="192" y="153" width="6" height="6" fill="currentColor"/>
      <rect x="160" y="170" width="6" height="6" fill="currentColor"/>
      <rect x="174" y="170" width="9" height="9" fill="currentColor"/>
      <rect x="192" y="170" width="9" height="9" fill="currentColor"/>
      <rect x="160" y="185" width="9" height="9" fill="currentColor"/>
      <rect x="178" y="185" width="6" height="6" fill="currentColor"/>
      <rect x="192" y="185" width="9" height="9" fill="currentColor"/>
    </svg>
  )
}
