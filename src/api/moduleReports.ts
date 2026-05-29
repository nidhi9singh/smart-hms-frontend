// src/api/moduleReports.ts
import api from '@/lib/axios'

export const modReportsApi = {
  // Appointment
  appointment:      (params: any) => api.get('/module-reports/appointment',      { params }),

  // OPD
  opd:              (params: any) => api.get('/module-reports/opd',              { params }),
  opdBalance:       (params: any) => api.get('/module-reports/opd-balance',      { params }),
  opdDischarged:    (params: any) => api.get('/module-reports/opd-discharged',   { params }),

  // IPD
  ipd:              (params: any) => api.get('/module-reports/ipd',              { params }),
  ipdBalance:       (params: any) => api.get('/module-reports/ipd-balance',      { params }),
  ipdDischarged:    (params: any) => api.get('/module-reports/ipd-discharged',   { params }),

  // Pharmacy
  pharmacyBill:     (params: any) => api.get('/module-reports/pharmacy-bill',    { params }),
  pharmacyExpiry:   (params: any) => api.get('/module-reports/pharmacy-expiry',  { params }),
  pharmacyStock:    (params: any) => api.get('/module-reports/pharmacy-stock',   { params }),

  // Pathology
  pathologyPatient: (params: any) => api.get('/module-reports/pathology-patient', { params }),
  pathologyBalance: (params: any) => api.get('/module-reports/pathology-balance', { params }),

  // Radiology
  radiologyPatient: (params: any) => api.get('/module-reports/radiology-patient', { params }),
  radiologyBalance: (params: any) => api.get('/module-reports/radiology-balance', { params }),

  // Blood Bank
  bloodIssue:       (params: any) => api.get('/module-reports/blood-issue',     { params }),
  componentIssue:   (params: any) => api.get('/module-reports/component-issue', { params }),
  bloodDonor:       (params: any) => api.get('/module-reports/blood-donor',     { params }),

  // Lookups
  doctors:          () => api.get('/module-reports/lookups/doctors'),
  medCategories:    () => api.get('/module-reports/lookups/medicine-categories'),
  medSuppliers:     () => api.get('/module-reports/lookups/medicine-suppliers'),
  staff:            () => api.get('/module-reports/lookups/staff'),
  pathologyTests:   () => api.get('/module-reports/lookups/pathology-tests'),
  pathologyCats:    () => api.get('/module-reports/lookups/pathology-categories'),
  radiologyTests:   () => api.get('/module-reports/lookups/radiology-tests'),
  radiologyCats:    () => api.get('/module-reports/lookups/radiology-categories'),
  bloodDonors:      () => api.get('/module-reports/lookups/blood-donors'),
  bloodGroups:      () => api.get('/module-reports/lookups/blood-groups'),
  users:            () => api.get('/module-reports/lookups/users'),
  vehicles:         () => api.get('/module-reports/lookups/vehicles'),
  tpas:             () => api.get('/module-reports/lookups/tpas'),

  // Ambulance / Birth-Death / HR / TPA / Inventory / Live / Log
  ambulance:        (params: any) => api.get('/module-reports/ambulance',          { params }),
  birth:            (params: any) => api.get('/module-reports/birth',              { params }),
  death:            (params: any) => api.get('/module-reports/death',              { params }),
  hrPayroll:        (params: any) => api.get('/module-reports/hr-payroll',         { params }),
  hrPayrollMonth:   (params: any) => api.get('/module-reports/hr-payroll-month',   { params }),
  hrAttendance:     (params: any) => api.get('/module-reports/hr-attendance',      { params }),
  hrAttendanceDay:  (params: any) => api.get('/module-reports/hr-attendance-day',  { params }),
  tpa:              (params: any) => api.get('/module-reports/tpa',                { params }),
  inventoryStock:   (params: any) => api.get('/module-reports/inventory-stock',    { params }),
  inventoryItem:    (params: any) => api.get('/module-reports/inventory-item',     { params }),
  inventoryIssue:   (params: any) => api.get('/module-reports/inventory-issue',    { params }),
  liveConsultation: (params: any) => api.get('/module-reports/live-consultation',  { params }),
  liveMeeting:      (params: any) => api.get('/module-reports/live-meeting',       { params }),
  logUser:          (params: any) => api.get('/module-reports/log-user',           { params }),
  logEmailSms:      (params: any) => api.get('/module-reports/log-email-sms',      { params }),
  logAudit:         (params: any) => api.get('/module-reports/log-audit',          { params }),

  // OT
  ot:               (params: any) => api.get('/module-reports/ot',                 { params }),
  operationCategories: () => api.get('/module-reports/lookups/operation-categories'),
  operations:       () => api.get('/module-reports/lookups/operations'),

  // Patient
  patientVisit:     (patient_id: number) => api.get('/module-reports/patient-visit', { params: { patient_id } }),
  patientCredential:(params: any) => api.get('/module-reports/patient-credential',  { params }),
}
