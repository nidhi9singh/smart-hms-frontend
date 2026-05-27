// src/api/multi_branch.ts
import api from '@/lib/axios'

export const multiBranchApi = {
  stats:         () => api.get('/multi-branch/stats'),
  report:        (type: string, from_date: string, to_date: string) =>
                   api.get(`/multi-branch/reports/${type}`, { params: { from_date, to_date } }),
  listBranches:  () => api.get('/multi-branch/branches'),
  addBranch:     (d: any)             => api.post('/multi-branch/branches', d),
  updateBranch:  (id: number, d: any) => api.put(`/multi-branch/branches/${id}`, d),
  deleteBranch:  (id: number)         => api.delete(`/multi-branch/branches/${id}`),
}
