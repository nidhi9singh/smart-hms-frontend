// src/api/setup.ts
import api from '@/lib/axios'

export const setupApi = {
  // ── General Setting ────────────────────────────────────────
  getGeneral:    () => api.get('/setup/general-setting'),
  updateGeneral: (d: any) => api.put('/setup/general-setting', d),
  uploadLogo:    (fd: FormData, label = 'logo') =>
    api.post(`/setup/upload-logo?label=${encodeURIComponent(label)}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ── Prefix Setting ─────────────────────────────────────────
  getPrefix:    () => api.get('/setup/prefix-setting'),
  updatePrefix: (d: any) => api.put('/setup/prefix-setting', d),

  // ── Attendance Setting ─────────────────────────────────────
  listAttendance: () => api.get('/setup/attendance-settings'),
  saveAttendance: (items: any[]) => api.put('/setup/attendance-settings', items),

  // ── Notification Setting ───────────────────────────────────
  listNotifications: () => api.get('/setup/notification-settings'),
  updateNotification: (eventKey: string, d: any) =>
    api.put(`/setup/notification-settings/${eventKey}`, d),

  // ── Captcha ────────────────────────────────────────────────
  listCaptcha: () => api.get('/setup/captcha-settings'),
  updateCaptcha: (pageKey: string, d: any) =>
    api.put(`/setup/captcha-settings/${pageKey}`, d),

  // ── Modules ────────────────────────────────────────────────
  listModules: (p?: Record<string, any>) =>
    api.get('/setup/module-settings', { params: p }),
  updateModule: (moduleKey: string, d: any) =>
    api.put(`/setup/module-settings/${moduleKey}`, d),

  // ── Languages ──────────────────────────────────────────────
  listLanguages: () => api.get('/setup/languages'),
  addLanguage:   (d: any) => api.post('/setup/languages', d),
  updateLanguage:(id: number, d: any) => api.put(`/setup/languages/${id}`, d),

  // ── Roles ──────────────────────────────────────────────────
  listRoles:  () => api.get('/setup/roles'),
  addRole:    (d: any) => api.post('/setup/roles', d),
  deleteRole: (id: number) => api.delete(`/setup/roles/${id}`),

  // ── Users ──────────────────────────────────────────────────
  listUsers:  () => api.get('/setup/users'),
  addUser:    (d: any) => api.post('/setup/users', d),
  updateUser: (id: number, d: any) => api.put(`/setup/users/${id}`, d),
  deleteUser: (id: number) => api.delete(`/setup/users/${id}`),

  // ── App settings (k/v) for gateway configs ─────────────────
  getAppSettings:    (scope: string) => api.get(`/setup/app-settings/${scope}`),
  saveAppSettings:   (scope: string, d: any) => api.put(`/setup/app-settings/${scope}`, d),

  // ── System ─────────────────────────────────────────────────
  systemVersion: () => api.get('/setup/system-version'),
}
