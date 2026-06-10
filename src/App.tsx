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
import PatientDetailPage from '@/pages/patients/PatientDetailPage'
import HRPage from '@/pages/hr/HRPage'
import StaffDetailPage from '@/pages/hr/StaffDetailPage'
import AppointmentsPage from '@/pages/appointments/AppointmentsPage'
import OPDPage from '@/pages/opd/OPDPage'
import IPDPage from '@/pages/ipd/IPDPage'
import IPDDetailPage from '@/pages/ipd/IPDDetailPage'
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
import LiveMeetingPage      from '@/pages/live_consultation/LiveMeetingPage'
import DownloadsPage from '@/pages/downloads/DownloadsPage'
import CertificatesPage   from '@/pages/certificates/CertificatesPage'
import PatientIdCardPage  from '@/pages/certificates/PatientIdCardPage'
import StaffIdCardPage    from '@/pages/certificates/StaffIdCardPage'
import CMSPage from '@/pages/cms/CMSPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import SettingsPage from '@/pages/setup/SettingsPage'
import PrintHeaderFooterPage from '@/pages/setup/print_header_footer/PrintHeaderFooterPage'
import HospitalChargesPage from '@/pages/setup/charges/HospitalChargesPage'
import BedSetupPage        from '@/pages/setup/bed/BedSetupPage'
import FrontOfficeSetupPage from '@/pages/setup/front_office/FrontOfficeSetupPage'
import OperationsSetupPage  from '@/pages/setup/operations/OperationsSetupPage'
import PharmacySetupPage    from '@/pages/setup/pharmacy/PharmacySetupPage'
import PathologySetupPage   from '@/pages/setup/pathology/PathologySetupPage'
import RadiologySetupPage   from '@/pages/setup/radiology/RadiologySetupPage'
import BloodBankSetupPage   from '@/pages/setup/blood_bank/BloodBankSetupPage'
import SymptomsSetupPage    from '@/pages/setup/symptoms/SymptomsSetupPage'
import FindingsSetupPage    from '@/pages/setup/findings/FindingsSetupPage'
import VitalsSetupPage      from '@/pages/setup/vitals/VitalsSetupPage'
import ZoomSetupPage        from '@/pages/setup/zoom/ZoomSetupPage'
import FinanceSetupPage     from '@/pages/setup/finance/FinanceSetupPage'
import HRSetupPage          from '@/pages/setup/human_resource/HRSetupPage'
import ReferralSetupPage    from '@/pages/setup/referral/ReferralSetupPage'
import AppointmentSetupPage from '@/pages/setup/appointment/AppointmentSetupPage'
import InventorySetupPage   from '@/pages/setup/inventory/InventorySetupPage'
import CustomFieldsPage     from '@/pages/setup/custom_fields/CustomFieldsPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import ChatPage from '@/pages/chat/ChatPage'
import RoleRoute from '@/routes/RoleRoute'
import ForbiddenPage from '@/pages/ForbiddenPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Always-accessible (no role gate) */}
          <Route path="/notifications"      element={<NotificationsPage />} />
          <Route path="/chat"               element={<ChatPage />} />
          <Route path="/403"                element={<ForbiddenPage />} />

          {/* Role-gated routes */}
          <Route element={<RoleRoute />}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/patients"           element={<PatientsPage />} />
          <Route path="/patients/:id"       element={<PatientDetailPage />} />
          <Route path="/billing"            element={<BillingPage />} />
          <Route path="/appointments"       element={<AppointmentsPage />} />
          <Route path="/opd"                element={<OPDPage />} />
          <Route path="/ipd"                element={<IPDPage />} />
          <Route path="/ipd/:id"            element={<IPDDetailPage />} />
          <Route path="/pharmacy"           element={<PharmacyPage />} />
          <Route path="/pathology"          element={<PathologyPage />} />
          <Route path="/radiology"          element={<RadiologyPage />} />
          <Route path="/blood-bank"         element={<BloodBankPage />} />
          <Route path="/ambulance"          element={<AmbulancePage />} />
          <Route path="/front-office"       element={<FrontOfficePage />} />
          <Route path="/birth-death"        element={<BirthDeathPage />} />
          <Route path="/multi-branch"       element={<MultiBranchPage />} />
          <Route path="/hr"                 element={<HRPage />} />
          <Route path="/hr/staff/:id"       element={<StaffDetailPage />} />
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
          <Route path="/live-consultation"           element={<LiveConsultationPage />} />
          <Route path="/live-consultation/meetings"  element={<LiveMeetingPage />} />
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
          <Route path="/setup"              element={<SettingsPage />} />
          <Route path="/setup/settings"            element={<SettingsPage />} />
          <Route path="/setup/print-header-footer" element={<PrintHeaderFooterPage />} />
          <Route path="/setup/hospital-charges"    element={<HospitalChargesPage />} />
          <Route path="/setup/bed"               element={<BedSetupPage />} />
          <Route path="/setup/front-office"      element={<FrontOfficeSetupPage />} />
          <Route path="/setup/operations"        element={<OperationsSetupPage />} />
          <Route path="/setup/pharmacy"          element={<PharmacySetupPage />} />
          <Route path="/setup/pathology"         element={<PathologySetupPage />} />
          <Route path="/setup/radiology"         element={<RadiologySetupPage />} />
          <Route path="/setup/blood-bank"        element={<BloodBankSetupPage />} />
          <Route path="/setup/symptoms"          element={<SymptomsSetupPage />} />
          <Route path="/setup/findings"          element={<FindingsSetupPage />} />
          <Route path="/setup/vitals"            element={<VitalsSetupPage />} />
          <Route path="/setup/zoom"              element={<ZoomSetupPage />} />
          <Route path="/setup/finance"           element={<FinanceSetupPage />} />
          <Route path="/setup/human-resource"    element={<HRSetupPage />} />
          <Route path="/setup/referral"          element={<ReferralSetupPage />} />
          <Route path="/setup/appointment"       element={<AppointmentSetupPage />} />
          <Route path="/setup/inventory"         element={<InventorySetupPage />} />
          <Route path="/setup/custom-fields"     element={<CustomFieldsPage />} />
          </Route>{/* /RoleRoute */}

          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
