// src/api/downloads.ts
import api from '@/lib/axios'

export const downloadsApi = {
  // Content Types
  listTypes:    (p?: Record<string, any>) => api.get('/download-center/types', { params: p }),
  addType:      (d: any)                  => api.post('/download-center/types', d),
  updateType:   (id: number, d: any)      => api.put(`/download-center/types/${id}`, d),
  deleteType:   (id: number)              => api.delete(`/download-center/types/${id}`),

  // Contents
  listContents: (p?: Record<string, any>) => api.get('/download-center/contents', { params: p }),
  uploadFile:   (formData: FormData)      =>
    api.post('/download-center/contents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadYoutube: (d: any) => api.post('/download-center/contents', d),
  deleteContent: (id: number) => api.delete(`/download-center/contents/${id}`),
  downloadUrl:   (id: number) => `/download-center/contents/${id}/download`,

  // Stats
  stats: () => api.get('/download-center/stats'),

  // Shares
  listShares:  (p?: Record<string, any>) => api.get('/download-center/shares', { params: p }),
  shareContent:(d: any)                  => api.post('/download-center/shares', d),
  deleteShare: (id: number)              => api.delete(`/download-center/shares/${id}`),
}
