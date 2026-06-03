// src/hooks/useHospitalSettings.ts
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'
import api from '@/lib/axios'

export interface HospitalSettings {
  hospital_name?: string
  hospital_code?: string
  address?: string
  phone?: string
  email?: string
  hospital_logo?: string
  hospital_small_logo?: string
  mobile_app_logo?: string
  currency?: string
  currency_symbol?: string
  language?: string
  date_format?: string
  time_format?: string
  timezone?: string
  theme?: string
}

/** Resolve a relative asset path (e.g. `uploads/setup/x.png`) to the live backend URL. */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (api.defaults?.baseURL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
  return `${base}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`
}

export function useHospitalSettings() {
  const q = useQuery({
    queryKey: ['hospital-settings'],
    queryFn:  () => setupApi.getGeneral().then(r => r.data?.data ?? {}),
    staleTime: 60_000,
  })
  const settings: HospitalSettings = q.data ?? {}

  // Keep the browser tab title in sync with the configured hospital name.
  useEffect(() => {
    if (settings.hospital_name) document.title = settings.hospital_name
  }, [settings.hospital_name])

  return {
    settings,
    isLoading: q.isLoading,
    logoUrl:      assetUrl(settings.hospital_logo),
    smallLogoUrl: assetUrl(settings.hospital_small_logo),
  }
}
