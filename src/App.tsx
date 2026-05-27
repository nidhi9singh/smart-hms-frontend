// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/routes/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

// Auth
import LoginPage from '@/pages/auth/LoginPage'

// Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage'

// Core modules (full UI)
import PatientsPage from '@/pages/patients/PatientsPage'
import HRPage from '@/pages/hr/HRPage'
import AppointmentsPage from '@/pages/appointments/AppointmentsPage'
import OPDPage from '@/pages/opd/OPDPage'
import IPDPage from '@/pages/ipd/IPDPage'
import PharmacyPage from '@/pages/pharmacy/PharmacyPage'
import BillingPage from '@/pages/billing/BillingPage'

// Other modules
import PathologyPage from '@/pages/pathology/PathologyPage'
import RadiologyPage from '@/pages/radiology/RadiologyPage'
import BloodBankPage from '@/pages/blood_bank/BloodBankPage'
import AmbulancePage from '@/pages/ambulance/AmbulancePage'
import FinancePage from '@/pages/finance/FinancePage'
import ReferralPage from '@/pages/referral/ReferralPage'
import TPAPage from '@/pages/tpa/TPAPage'
import DutyRosterPage from '@/pages/duty_roster/DutyRosterPage'
import QRAttendancePage from '@/pages/attendance/QRAttendancePage'
import QRAttendanceSettingsPage from '@/pages/attendance/QRAttendanceSettingsPage'
import AnnualCalendarPage from '@/pages/calendar/AnnualCalendarPage'
import FrontOfficePage from '@/pages/front_office/FrontOfficePage'
import BirthDeathPage from '@/pages/birth_death/BirthDeathPage'
import MultiBranchPage from '@/pages/multi_branch/MultiBranchPage'
import MessagingPage from '@/pages/messaging/MessagingPage'
import InventoryPage from '@/pages/inventory/InventoryPage'
import LiveConsultationPage from '@/pages/live_consultation/LiveConsultationPage'
import DownloadsPage from '@/pages/downloads/DownloadsPage'
import CertificatesPage   from '@/pages/certificates/CertificatesPage'
import PatientIdCardPage  from '@/pages/certificates/PatientIdCardPage'
import StaffIdCardPage    from '@/pages/certificates/StaffIdCardPage'
import CMSPage from '@/pages/cms/CMSPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import SettingsPage from '@/pages/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/patients"           element={<PatientsPage />} />
          <Route path="/billing"            element={<BillingPage />} />
          <Route path="/appointments"       element={<AppointmentsPage />} />
          <Route path="/opd"                element={<OPDPage />} />
          <Route path="/ipd"                element={<IPDPage />} />
          <Route path="/pharmacy"           element={<PharmacyPage />} />
          <Route path="/pathology"          element={<PathologyPage />} />
          <Route path="/radiology"          element={<RadiologyPage />} />
          <Route path="/blood-bank"         element={<BloodBankPage />} />
          <Route path="/ambulance"          element={<AmbulancePage />} />
          <Route path="/front-office"       element={<FrontOfficePage />} />
          <Route path="/birth-death"        element={<BirthDeathPage />} />
          <Route path="/multi-branch"       element={<MultiBranchPage />} />
          <Route path="/hr"                 element={<HRPage />} />
          <Route path="/attendance"          element={<QRAttendancePage />} />
          <Route path="/attendance/settings" element={<QRAttendanceSettingsPage />} />
          <Route path="/duty-roster"        element={<DutyRosterPage />} />
          <Route path="/calendar"           element={<AnnualCalendarPage />} />
          <Route path="/referral"           element={<ReferralPage />} />
          <Route path="/tpa"                element={<TPAPage />} />
          <Route path="/finance"            element={<FinancePage defaultTab="income" />} />
          <Route path="/finance/income"     element={<FinancePage defaultTab="income" />} />
          <Route path="/finance/expenses"   element={<FinancePage defaultTab="expense" />} />
          <Route path="/messaging"          element={<MessagingPage />} />
          <Route path="/inventory"          element={<InventoryPage />} />
          <Route path="/live-consultation"  element={<LiveConsultationPage />} />
          <Route path="/downloads"          element={<DownloadsPage defaultTab="contents" />} />
          <Route path="/downloads/upload"   element={<DownloadsPage defaultTab="contents" />} />
          <Route path="/downloads/shares"   element={<DownloadsPage defaultTab="shares" />} />
          <Route path="/downloads/types"    element={<DownloadsPage defaultTab="types" />} />
          <Route path="/certificates"               element={<CertificatesPage />} />
          <Route path="/certificates/patient-id"    element={<PatientIdCardPage />} />
          <Route path="/certificates/staff-id"      element={<StaffIdCardPage />} />
          <Route path="/cms"                element={<CMSPage />} />
          <Route path="/reports"            element={<ReportsPage />} />
          <Route path="/settings"           element={<SettingsPage />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
