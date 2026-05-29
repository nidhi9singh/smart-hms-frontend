// src/api/financeReports.ts
import api from '@/lib/axios'

export const finReportsApi = {
  dailyTransaction: (params: { date_from: string; date_to: string }) =>
    api.get('/finance-reports/daily-transaction', { params }),
  transactions: (params: any) =>
    api.get('/finance-reports/transactions', { params }),
  income: (params: any) =>
    api.get('/finance-reports/income', { params }),
  incomeGroup: (params: any) =>
    api.get('/finance-reports/income-group', { params }),
  expense: (params: any) =>
    api.get('/finance-reports/expense', { params }),
  expenseGroup: (params: any) =>
    api.get('/finance-reports/expense-group', { params }),
  patientBill: (case_id: string) =>
    api.get('/finance-reports/patient-bill', { params: { case_id } }),
  referral: (params: any) =>
    api.get('/finance-reports/referral', { params }),
  processing: (params: any) =>
    api.get('/finance-reports/processing', { params }),
  balance: (params: any) =>
    api.get('/finance-reports/balance', { params }),

  // Lookups
  heads:         () => api.get('/finance-reports/lookups/heads'),
  incomeHeads:   () => api.get('/finance-reports/lookups/income-heads'),
  expenseHeads:  () => api.get('/finance-reports/lookups/expense-heads'),
  payees:        () => api.get('/finance-reports/lookups/payees'),
  users:         () => api.get('/finance-reports/lookups/users'),
}
