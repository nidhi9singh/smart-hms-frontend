// src/api/zoomSetup.ts
import api from '@/lib/axios'

export const zoomSetupApi = {
  get:  () => api.get('/setup/app-settings/zoom'),
  save: (payload: Record<string, any>) => api.put('/setup/app-settings/zoom', payload),
}
