import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

import { ProtocolsService, UsersService, ReviewAssignmentsService } from '@/client'

// ---------- Zod Schema ----------
const formSchema = z.object({
  protocol_id: z.string().min(1, 'กรุณาเลือกโครงการวิจัย'),
  reviewer_id: z.string().min(1, 'กรุณาเลือกผู้ตรวจสอบ'),
  due_date: z.string().min(1, 'กรุณากำหนดวันส่ง').refine((v) => !isNaN(Date.parse(v)), {
    message: 'รูปแบบวันที่ไม่ถูกต้อง',
  }),
})

type FormValues = z.infer<typeof formSchema>

// ---------- Helper: หา method จาก SDK class ----------
function findMethod(svc: any, regex: RegExp) {
  const targets = [svc, svc?.prototype].filter(Boolean)
  for (const t of targets) {
    for (const name of Object.getOwnPropertyNames(t)) {
      if (typeof t[name] === 'function' && regex.test(name)) {
        return { name, fn: t[name].bind(svc) }
      }
    }
  }
  return null
}

// ---------- Component ----------
export function CreateAssignmentDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { protocol_id: '', reviewer_id: '', due_date: '' },
  })

  // 1. ดึง Protocol ที่รอการมอบหมาย (PENDING_ASSIGNMENT)
  const { data: protocolsRes, isLoading: loadingProtocols } = useQuery({
    queryKey: ['protocols-pending-assignment'],
    queryFn: async () => {
      const m = findMethod(ProtocolsService, /readProtocols$/i)
      if (!m) throw new Error('ไม่พบ method readProtocols')
      const res: any = await m.fn({ query: { skip: 0, limit: 100, status: 'PENDING_ASSIGNMENT' } })
      return res?.data?.data ?? res?.data ?? []
    },
    enabled: open,
  })

  // 2. ดึง User ที่มี role = REVIEWER
  const { data: reviewersRes, isLoading: loadingReviewers } = useQuery({
    queryKey: ['reviewers'],
    queryFn: async () => {
      const m = findMethod(UsersService, /readUsers$/i)
      if (!m) throw new Error('ไม่พบ method readUsers')
      const res: any = await m.fn({ query: { skip: 0, limit: 100, role: 'REVIEWER' } })
      return res?.data?.data ?? res?.data ?? []
    },
    enabled: open,
  })

  // 3. Mutation สำหรับสร้าง Assignment
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const m = findMethod(ReviewAssignmentsService, /createReviewAssignment$/i)
      if (!m) throw new Error('ไม่พบ method createReviewAssignment')
      return m.fn({
        body: {
          protocol_id: values.protocol_id,
          reviewer_id: values.reviewer_id,
          due_date: new Date(values.due_date).toISOString(),
        },
      })
    },
    onSuccess: () => {
      toast.success('มอบหมายงานตรวจสอบเรียบร้อยแล้ว')
      queryClient.invalidateQueries({ queryKey: ['review-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      queryClient.invalidateQueries({ queryKey: ['protocols-pending-assignment'] })
      setOpen(false)
      form.reset()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || err?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = (values: FormValues) => createMutation.mutate(values)
  const protocols = Array.isArray(protocolsRes) ? protocolsRes : []
  const reviewers = Array.isArray(reviewersRes) ? reviewersRes : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ มอบหมายงานใหม่</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>มอบหมายงานตรวจสอบใหม่</DialogTitle>
          <DialogDescription>
            เลือกโครงการวิจัยและผู้ตรวจสอบ เพื่อกำหนดให้ reviewer ดำเนินการตรวจสอบ
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Protocol Select */}
            <FormField control={form.control} name="protocol_id" render={({ field }) => (
              <FormItem>
                <FormLabel>โครงการวิจัย (Protocol)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={loadingProtocols}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingProtocols ? 'กำลังโหลด...' : protocols.length === 0 ? 'ไม่มีโครงการที่รอการมอบหมาย' : 'เลือกโครงการวิจัย'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {protocols.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        [{p.id.slice(0, 8)}] {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Reviewer Select */}
            <FormField control={form.control} name="reviewer_id" render={({ field }) => (
              <FormItem>
                <FormLabel>ผู้ตรวจสอบ (Reviewer)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={loadingReviewers}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingReviewers ? 'กำลังโหลด...' : reviewers.length === 0 ? 'ไม่มี reviewer ในระบบ' : 'เลือกผู้ตรวจสอบ'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {reviewers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Due Date */}
            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem>
                <FormLabel>กำหนดส่ง (Due Date)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createMutation.isPending ? 'กำลังบันทึก...' : 'มอบหมายงาน'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}