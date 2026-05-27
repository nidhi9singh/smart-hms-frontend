// src/api/cms.ts
import api from '@/lib/axios'

export const cmsApi = {
  // Pages
  listPages:    (p?: Record<string, any>) => api.get('/cms/pages', { params: p }),
  getPage:      (id: number)               => api.get(`/cms/pages/${id}`),
  addPage:      (d: any)                   => api.post('/cms/pages', d),
  updatePage:   (id: number, d: any)       => api.put(`/cms/pages/${id}`, d),
  deletePage:   (id: number)               => api.delete(`/cms/pages/${id}`),
  uploadFeatured: (fd: FormData) =>
    api.post('/cms/pages/upload-featured', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Menus (groups)
  listMenus:   ()                         => api.get('/cms/menus'),
  addMenu:     (d: any)                   => api.post('/cms/menus', d),
  updateMenu:  (id: number, d: any)       => api.put(`/cms/menus/${id}`, d),
  deleteMenu:  (id: number)               => api.delete(`/cms/menus/${id}`),

  // Menu items
  listMenuItems: (p?: Record<string, any>) => api.get('/cms/menu-items', { params: p }),
  addMenuItem:   (d: any)                  => api.post('/cms/menu-items', d),
  updateMenuItem:(id: number, d: any)      => api.put(`/cms/menu-items/${id}`, d),
  deleteMenuItem:(id: number)              => api.delete(`/cms/menu-items/${id}`),

  // Banners
  listBanners:    ()                       => api.get('/cms/banners'),
  uploadBanner:   (fd: FormData) =>
    api.post('/cms/banners/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBanner:   (id: number, d: any)     => api.put(`/cms/banners/${id}`, d),
  deleteBanner:   (id: number)             => api.delete(`/cms/banners/${id}`),

  // Media
  listMedia:     (p?: Record<string, any>) => api.get('/cms/media', { params: p }),
  uploadMedia:   (fd: FormData) =>
    api.post('/cms/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addYoutube:    (d: any)                  => api.post('/cms/media/youtube', d),
  deleteMedia:   (id: number)              => api.delete(`/cms/media/${id}`),
  downloadUrl:   (id: number)              => `/cms/media/${id}/download`,
}
