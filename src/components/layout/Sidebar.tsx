// src/components/layout/Sidebar.tsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, Stethoscope, Bed, Pill,
  FlaskConical, RadioTower, Droplets, Ambulance, Building2,
  Baby, GitBranch, UserCog, QrCode, ClipboardList, CalendarDays,
  Receipt, Banknote, Share2, Shield, MessageSquare,
  Video, Download, Award, Globe, BarChart3, Settings,
  LogOut, ChevronDown, ChevronRight, Boxes, Wrench,
  Activity, ScanLine, HeartPulse, Printer
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/access'
import { useHospitalSettings } from '@/hooks/useHospitalSettings'
import { cn } from '@/lib/utils'

type LeafItem  = { path: string;  label: string; icon: any }
type GroupItem = { label: string; icon: any; children: LeafItem[] }
type NavItem   = LeafItem | GroupItem

const isGroup = (i: NavItem): i is GroupItem => 'children' in i

const NAV: NavItem[] = [
  { path:'/dashboard',    label:'Dashboard',           icon:LayoutDashboard },
  { path:'/patients',     label:'Patient',             icon:Users },
  { path:'/billing',      label:'Billing',             icon:Receipt },
  { path:'/appointments', label:'Appointment',         icon:Calendar },
  { path:'/opd',          label:'OPD – Out Patient',   icon:Stethoscope },
  { path:'/ipd',          label:'IPD – In Patient',    icon:Bed },
  { path:'/pharmacy',     label:'Pharmacy',            icon:Pill },
  { path:'/pathology',    label:'Pathology',           icon:FlaskConical },
  { path:'/radiology',    label:'Radiology',           icon:RadioTower },
  { path:'/blood-bank',   label:'Blood Bank',          icon:Droplets },
  { path:'/ambulance',    label:'Ambulance',           icon:Ambulance },
  { path:'/front-office', label:'Front Office',        icon:Building2 },
  { path:'/birth-death',  label:'Birth & Death Record',icon:Baby },
  { path:'/multi-branch', label:'Multi Branch',        icon:GitBranch },
  { path:'/hr',           label:'Human Resource',      icon:UserCog },
  { path:'/attendance',   label:'QR Code Attendance',  icon:QrCode },
  { path:'/duty-roster',  label:'Duty Roster',         icon:ClipboardList },
  { path:'/calendar',     label:'Annual Calendar',     icon:CalendarDays },
  { path:'/referral',     label:'Referral',            icon:Share2 },
  { path:'/tpa',          label:'TPA Management',      icon:Shield },
  { path:'/finance',      label:'Finance',             icon:Banknote },
  { path:'/messaging',    label:'Messaging',           icon:MessageSquare },
  { path:'/inventory',    label:'Inventory',           icon:Boxes },
  {
    label: 'Live Consultation', icon: Video,
    children: [
      { path:'/live-consultation',          label:'Live Consultation', icon:Video },
      { path:'/live-consultation/meetings', label:'Live Meeting',      icon:Video },
    ],
  },
  { path:'/downloads',    label:'Download Centre',     icon:Download },
  {
    label: 'Certificate', icon: Award,
    children: [
      { path:'/certificates',            label:'Certificate',     icon:Award },
      { path:'/certificates/patient-id', label:'Patient ID Card', icon:Award },
      { path:'/certificates/staff-id',   label:'Staff ID Card',   icon:Award },
    ],
  },
  { path:'/cms',      label:'Front CMS', icon:Globe },
  { path:'/reports',  label:'Reports',   icon:BarChart3 },
  {
    label: 'Setup', icon: Wrench,
    children: [
      { path:'/setup/settings',            label:'Settings',            icon:Settings },
      { path:'/setup/print-header-footer', label:'Print Header Footer', icon:Printer },
      { path:'/setup/hospital-charges',    label:'Hospital Charges',    icon:Receipt },
      { path:'/setup/bed',                 label:'Bed',                 icon:Bed },
      { path:'/setup/front-office',        label:'Front Office',        icon:Building2 },
      { path:'/setup/operations',          label:'Operations',          icon:Stethoscope },
      { path:'/setup/pharmacy',            label:'Pharmacy',            icon:Pill },
      { path:'/setup/pathology',           label:'Pathology',           icon:FlaskConical },
      { path:'/setup/radiology',           label:'Radiology',           icon:RadioTower },
      { path:'/setup/blood-bank',          label:'Blood Bank',          icon:Droplets },
      { path:'/setup/symptoms',            label:'Symptoms',            icon:Activity },
      { path:'/setup/findings',            label:'Findings',            icon:ScanLine },
      { path:'/setup/vitals',              label:'Vitals',              icon:HeartPulse },
      { path:'/setup/zoom',                label:'Zoom Setting',        icon:Video },
      { path:'/setup/finance',             label:'Finance',             icon:Banknote },
      { path:'/setup/human-resource',      label:'Human Resource',      icon:UserCog },
      { path:'/setup/referral',            label:'Referral',            icon:Share2 },
      { path:'/setup/appointment',         label:'Appointment',         icon:Calendar },
      { path:'/setup/inventory',           label:'Inventory',           icon:Boxes },
      { path:'/setup/custom-fields',       label:'Custom Field',        icon:ClipboardList },
    ],
  },
]

// Per-role Setup sub-menu whitelist. Roles not listed here see every Setup
// child their `setup` module access permits (the existing canAccess pipeline).
const SETUP_BY_ROLE: Record<string, string[]> = {
  pathologist: [
    '/setup/print-header-footer',
    '/setup/pathology',
    '/setup/blood-bank',
    '/setup/finance',
  ],
  nurse: [
    '/setup/bed',
  ],
  pharmacist: [
    '/setup/hospital-charges',
    '/setup/print-header-footer',
    '/setup/pharmacy',
    '/setup/finance',
  ],
  radiologist: [
    '/setup/hospital-charges',
    '/setup/print-header-footer',
    '/setup/radiology',
    '/setup/finance',
  ],
  doctor: [
    '/setup/hospital-charges',
    '/setup/bed',
    '/setup/print-header-footer',
    '/setup/pharmacy',
    '/setup/symptoms',
    '/setup/finance',
    '/setup/appointment',
  ],
}

// Per-role Certificate sub-menu whitelist. Roles not listed see every child.
const CERTIFICATE_BY_ROLE: Record<string, string[]> = {
  doctor: [
    '/certificates',
    '/certificates/patient-id',
  ],
}


export default function Sidebar({
  mobileOpen = false, onClose,
}: { mobileOpen?: boolean; onClose?: () => void } = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAuth = useAuthStore(s => s.clearAuth)
  const user = useAuthStore(s => s.user)
  const [collapsed, setCollapsed] = useState(false)

  // Auto-close the mobile drawer whenever the user navigates somewhere.
  useEffect(() => { if (mobileOpen) onClose?.() }, [location.pathname])

  const { settings, logoUrl, smallLogoUrl } = useHospitalSettings()
  const sidebarLogo = collapsed
    ? (smallLogoUrl || logoUrl || '/cognate.jpg')
    : (logoUrl       || '/cognate.jpg')

  const handleLogout = () => { clearAuth(); navigate('/login') }

  // Track which groups are expanded. Auto-expand a group when one of its children matches the current route.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const isGroupActive = (g: GroupItem) =>
    g.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
  const toggleGroup = (label: string) =>
    setOpenGroups(s => ({ ...s, [label]: !s[label] }))

  return (
    <>
      {/* Mobile backdrop — only visible when the drawer is open on <lg widths */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
    <aside className={cn(
      'flex flex-col h-screen bg-white border-r border-gray-200 transition-transform duration-200 flex-shrink-0',
      // <lg: fixed slide-over drawer (collapsed/expanded toggle hidden, always 224px)
      'fixed top-0 left-0 z-40 w-56',
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
      // lg+: normal in-flow sidebar; respects the collapsed toggle
      'lg:relative lg:translate-x-0 lg:transition-all',
      collapsed ? 'lg:w-14' : 'lg:w-56'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-gray-100">
        <img src={sidebarLogo} alt={settings.hospital_name || 'Hospital'}
          className={cn('object-contain flex-shrink-0', collapsed ? 'h-8 w-8 hidden lg:block' : 'h-10 w-auto max-w-[140px]')}/>
        <button onClick={() => setCollapsed(c => !c)} className="ml-auto p-1 rounded hover:bg-gray-100 flex-shrink-0 hidden lg:flex">
          {collapsed ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}
        </button>
        {/* Mobile-only close button */}
        <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-100 flex-shrink-0 lg:hidden" title="Close menu">
          <ChevronRight size={14} className="rotate-180"/>
        </button>
      </div>

      {/* Nav — filtered by role */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV
          // Filter: leaves hidden when role lacks access; groups hidden when ALL children blocked.
          .map(item => {
            if (!isGroup(item)) return canAccess(user?.role, item.path) ? item : null
            // Whitelists are group-scoped — applying SETUP_BY_ROLE to every group
            // would wipe out unrelated groups (Live Consultation, Download, etc.).
            const roleKey = user?.role ?? ''
            const roleWhitelist =
              item.label === 'Setup'       ? SETUP_BY_ROLE[roleKey] :
              item.label === 'Certificate' ? CERTIFICATE_BY_ROLE[roleKey] :
              undefined
            const visible = item.children
              .filter(c => canAccess(user?.role, c.path))
              .filter(c => !roleWhitelist || roleWhitelist.includes(c.path))
            return visible.length ? { ...item, children: visible } : null
          })
          .filter((x): x is NavItem => x !== null)
          .map(item => {
          if (!isGroup(item)) {
            return (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) => cn(
                  'sidebar-link',
                  isActive && 'active',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={15} className="flex-shrink-0" />
                {!collapsed && <span className="truncate text-xs">{item.label}</span>}
              </NavLink>
            )
          }

          const active = isGroupActive(item)
          const open   = openGroups[item.label] ?? active

          // Collapsed mode: don't show the group header — just render children as flat icons with tooltips
          if (collapsed) {
            return item.children.map(c => (
              <NavLink key={c.path} to={c.path}
                className={({ isActive }) => cn('sidebar-link justify-center px-0', isActive && 'active')}
                title={c.label}
              >
                <c.icon size={15} className="flex-shrink-0"/>
              </NavLink>
            ))
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  'sidebar-link w-full',
                  active && 'active'
                )}
              >
                <item.icon size={15} className="flex-shrink-0"/>
                <span className="truncate text-xs flex-1 text-left">{item.label}</span>
                {open
                  ? <ChevronDown  size={12} className="text-gray-400 flex-shrink-0"/>
                  : <ChevronRight size={12} className="text-gray-400 flex-shrink-0"/>}
              </button>
              {open && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                  {item.children.map(c => (
                    <NavLink key={c.path} to={c.path} end
                      className={({ isActive }) => cn('sidebar-link text-xs', isActive && 'active')}
                    >
                      <ChevronRight size={11} className="flex-shrink-0 text-gray-400"/>
                      <span className="truncate">{c.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{user?.name ?? 'User'}</div>
              <div className="text-[10px] text-gray-400 capitalize truncate">{user?.role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className={cn('sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600', collapsed && 'justify-center')}>
          <LogOut size={14} className="flex-shrink-0"/>
          {!collapsed && <span className="text-xs">Logout</span>}
        </button>
      </div>
    </aside>
    </>
  )
}
