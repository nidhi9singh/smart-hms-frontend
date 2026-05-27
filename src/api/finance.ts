// src/api/finance.ts
import api from '@/lib/axios'

export const financeApi = {
  // Summary
  summary:        () => api.get('/finance/summary'),

  // Income heads
  listIncomeHeads:   () => api.get('/finance/income-heads'),
  addIncomeHead:     (d: any) => api.post('/finance/income-heads', d),
  deleteIncomeHead:  (id: number) => api.delete(`/finance/income-heads/${id}`),

  // Income
  listIncomes:    (p?: Record<string, any>) => api.get('/finance/income', { params: p }),
  addIncome:      (d: any)                  => api.post('/finance/income', d),
  updateIncome:   (id: number, d: any)      => api.put(`/finance/income/${id}`, d),
  deleteIncome:   (id: number)              => api.delete(`/finance/income/${id}`),

  // Expense heads
  listExpenseHeads:  () => api.get('/finance/expense-heads'),
  addExpenseHead:    (d: any) => api.post('/finance/expense-heads', d),
  deleteExpenseHead: (id: number) => api.delete(`/finance/expense-heads/${id}`),

  // Expense
  listExpenses:   (p?: Record<string, any>) => api.get('/finance/expense', { params: p }),
  addExpense:     (d: any)                  => api.post('/finance/expense', d),
  updateExpense:  (id: number, d: any)      => api.put(`/finance/expense/${id}`, d),
  deleteExpense:  (id: number)              => api.delete(`/finance/expense/${id}`),
}
