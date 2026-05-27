// src/hooks/useOPD.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { opdApi, type OPDCreate } from '@/api/opd'

export function useOPDList(params?: {
  filter_type?: 'today' | 'upcoming' | 'old'
  consultant_id?: number
  search?: string
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ['opd', params],
    queryFn: () => opdApi.list(params),
  })
}

export function useOPDDetail(id: number | null) {
  return useQuery({
    queryKey: ['opd', id],
    queryFn: () => opdApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateOPD() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => opdApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opd'] })
      toast.success('OPD patient added')
    },
  })
}

export function useUpdateOPD() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OPDCreate> }) => opdApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opd'] })
      toast.success('OPD updated')
    },
  })
}

export function useDeleteOPD() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => opdApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opd'] })
      toast.success('OPD record deleted')
    },
  })
}

export function useChargeCategories() {
  return useQuery({
    queryKey: ['opd-charge-categories'],
    queryFn: () => opdApi.chargeCategories(),
  })
}

export function useCharges(categoryId?: number) {
  return useQuery({
    queryKey: ['opd-charges', categoryId],
    queryFn: () => opdApi.charges(categoryId),
    enabled: !!categoryId,
  })
}

export function usePatientVisits(patientId: number | null) {
  return useQuery({
    queryKey: ['opd-patient-visits', patientId],
    queryFn: () => opdApi.patientVisits(patientId!),
    enabled: !!patientId,
  })
}