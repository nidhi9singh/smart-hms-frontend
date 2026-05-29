// src/lib/access.ts
// Single source of truth for role-based module access.
//
// Each route in the app maps to one Module. Each Role has a set of accessible
// Modules. canAccess(role, path) is the only function components should call.

export type Role =
  | 'super_admin' | 'admin' | 'doctor' | 'nurse'
  | 'pharmacist' | 'pathologist' | 'radiologist'
  | 'accountant' | 'receptionist'

export type Module =
  | 'dashboard' | 'patients' | 'billing' | 'appointment'
  | 'opd' | 'ipd' | 'pharmacy' | 'pathology' | 'radiology'
  | 'blood_bank' | 'ambulance' | 'front_office' | 'birth_death'
  | 'multi_branch' | 'human_resource' | 'qr_attendance'
  | 'duty_roster' | 'annual_calendar' | 'referral' | 'tpa'
  | 'finance' | 'messaging' | 'inventory' | 'live_consultation'
  | 'downloads' | 'certificates' | 'cms' | 'reports' | 'setup'

// Paths that any authenticated user can reach.
const PUBLIC_PATHS = ['/notifications', '/chat', '/403']

// Longest-prefix match — declare more specific paths BEFORE their generic parents.
const PATH_TO_MODULE: Array<[string, Module]> = [
  // Specific / sub-paths first
  ['/attendance/settings',         'qr_attendance'],
  ['/certificates/patient-id',     'certificates'],
  ['/certificates/staff-id',       'certificates'],
  ['/live-consultation/meetings',  'live_consultation'],
  ['/finance/income',              'finance'],
  ['/finance/expenses',            'finance'],
  ['/downloads/upload',            'downloads'],
  ['/downloads/shares',            'downloads'],
  ['/downloads/types',             'downloads'],

  // Module roots
  ['/dashboard',          'dashboard'],
  ['/patients',           'patients'],
  ['/billing',            'billing'],
  ['/appointments',       'appointment'],
  ['/opd',                'opd'],
  ['/ipd',                'ipd'],
  ['/pharmacy',           'pharmacy'],
  ['/pathology',          'pathology'],
  ['/radiology',          'radiology'],
  ['/blood-bank',         'blood_bank'],
  ['/ambulance',          'ambulance'],
  ['/front-office',       'front_office'],
  ['/birth-death',        'birth_death'],
  ['/multi-branch',       'multi_branch'],
  ['/hr',                 'human_resource'],
  ['/attendance',         'qr_attendance'],
  ['/duty-roster',        'duty_roster'],
  ['/calendar',           'annual_calendar'],
  ['/referral',           'referral'],
  ['/tpa',                'tpa'],
  ['/finance',            'finance'],
  ['/messaging',          'messaging'],
  ['/inventory',          'inventory'],
  ['/live-consultation',  'live_consultation'],
  ['/downloads',          'downloads'],
  ['/certificates',       'certificates'],
  ['/cms',                'cms'],
  ['/reports',            'reports'],
  ['/settings',           'setup'],
  ['/setup',              'setup'],
]

const ALL_MODULES = new Set<Module>(PATH_TO_MODULE.map(([, m]) => m))

// Per the org's Role-Access policy.
const ROLE_ACCESS: Record<Role, Set<Module>> = {
  super_admin: ALL_MODULES,
  admin:       ALL_MODULES,

  doctor: new Set<Module>([
    'dashboard', 'patients', 'appointment', 'opd', 'ipd',
    'pharmacy', 'pathology', 'radiology', 'blood_bank',
    'billing', 'live_consultation', 'messaging',
    'downloads', 'certificates', 'reports', 'setup',
  ]),

  nurse: new Set<Module>([
    'dashboard', 'patients', 'billing', 'opd', 'ipd',
    'pharmacy', 'blood_bank', 'human_resource',
    'messaging', 'downloads', 'live_consultation',
    'reports', 'setup',
  ]),

  pharmacist: new Set<Module>([
    'dashboard', 'patients', 'pharmacy', 'billing',
    'messaging', 'downloads', 'reports', 'setup',
  ]),

  pathologist: new Set<Module>([
    'dashboard', 'patients', 'pathology', 'billing',
    'messaging', 'downloads', 'reports', 'setup',
  ]),

  radiologist: new Set<Module>([
    'dashboard', 'patients', 'radiology', 'billing',
    'messaging', 'downloads', 'reports', 'setup',
  ]),

  accountant: new Set<Module>([
    'dashboard', 'billing', 'finance', 'referral', 'tpa',
    'messaging', 'downloads', 'reports', 'setup',
  ]),

  receptionist: new Set<Module>([
    'dashboard', 'patients', 'appointment', 'opd',
    'front_office', 'billing', 'messaging',
    'downloads', 'reports', 'setup',
  ]),
}


/** Resolve a URL path (e.g. "/opd/42") to its Module key, or null if unmapped. */
export function pathToModule(path: string): Module | null {
  // Longest-prefix wins — table is already sorted that way.
  for (const [prefix, mod] of PATH_TO_MODULE) {
    if (path === prefix || path.startsWith(prefix + '/')) return mod
  }
  return null
}


/** Does a role have access to a given path? Unknown / public paths are allowed. */
export function canAccess(role: string | undefined, path: string): boolean {
  if (!role) return false
  if (PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))) return true

  const mod = pathToModule(path)
  if (!mod) return true   // unmapped routes default to allowed (e.g. /login redirect)

  const allowed = ROLE_ACCESS[role as Role]
  if (!allowed) return false      // unknown role → deny
  return allowed.has(mod)
}


/** All modules a role is granted — useful for nav filtering. */
export function allowedModules(role: string | undefined): Set<Module> {
  if (!role) return new Set()
  return ROLE_ACCESS[role as Role] ?? new Set()
}
