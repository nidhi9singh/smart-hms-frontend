export const cn = (...classes: (string | undefined | null | boolean)[]) =>
  classes.filter(Boolean).join(' ')

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

export const fmtCurrency = (n: number | string | null | undefined) =>
  n != null ? `₹${Number(n).toFixed(2)}` : '₹0.00'

export const initials = (name?: string) =>
  (name ?? '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

export const avatarBg = (i: number) => {
  const colors = [
    'bg-brand-100 text-brand-700', 'bg-brand-100 text-brand-700',
    'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700', 'bg-purple-100 text-purple-700',
  ]
  return colors[i % colors.length]
}

export const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    Active:'badge-green', Inactive:'badge-gray',
    Pending:'badge-amber', Approved:'badge-green', Disapprove:'badge-red',
    Scheduled:'badge-blue', Completed:'badge-teal', Cancelled:'badge-red',
    Admitted:'badge-green', Discharged:'badge-gray',
    Paid:'badge-green', Unpaid:'badge-red',
    Male:'badge-blue', Female:'badge-pink', Yes:'badge-teal', No:'badge-gray',
  }
  return map[status] ?? 'badge-gray'
}

export const calcAge = (dob?: string) => {
  if (!dob) return '—'
  return `${new Date().getFullYear() - new Date(dob).getFullYear()}Y`
}
