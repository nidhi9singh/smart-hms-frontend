// src/api/financeSetup.ts
import api from '@/lib/axios'

export type HeadItem = { name: string; description?: string | null }

export const financeSetupApi = {
  // Income Heads (batch add)
  listIncomeHeads:   () => api.get('/finance-setup/income-heads'),
  addIncomeHeads:    (items: HeadItem[]) => api.post('/finance-setup/income-heads', items),
  updateIncomeHead:  (id: number, d: any) => api.put(`/finance-setup/income-heads/${id}`, d),
  deleteIncomeHead:  (id: number) => api.delete(`/finance-setup/income-heads/${id}`),

  // Expense Heads (batch add)
  listExpenseHeads:  () => api.get('/finance-setup/expense-heads'),
  addExpenseHeads:   (items: HeadItem[]) => api.post('/finance-setup/expense-heads', items),
  updateExpenseHead: (id: number, d: any) => api.put(`/finance-setup/expense-heads/${id}`, d),
  deleteExpenseHead: (id: number) => api.delete(`/finance-setup/expense-heads/${id}`),
}
