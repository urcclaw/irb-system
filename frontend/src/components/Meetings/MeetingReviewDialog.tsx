import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MeetingsService } from '@/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import useCustomToast from '@/hooks/useCustomToast'

interface Props {
  meetingId: string
  protocolId: string | null
  onOpenChange: (open: boolean) => void
}

export function MeetingReviewDialog({ meetingId, protocolId, onOpenChange }: Props) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [decision, setDecision] = useState<string>('APPROVE')
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (protocolId) { setDecision('APPROVE'); setComments('') }
  }, [protocolId])

  const mutation = useMutation({
    mutationFn: () => MeetingsService.reviewProtocolInMeeting({
      data: { meetingId, protocolId: protocolId!, requestBody: { decision, comments } },
    }),
    onSuccess: () => {
      showSuccessToast('บันทึกผลการพิจารณาสเร็จ')
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
      onOpenChange(false)
    },
    onError: (err: Error) => showErrorToast(err.message),
  })

  return (
    <Dialog open={!!protocolId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกผลการพิจารณา</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>ผลการพิจารณา</Label>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVE">อนุมัติ (Approve)</SelectItem>
                <SelectItem value="REVISE">แก้ไข (Revise)</SelectItem>
                <SelectItem value="REJECT">ไม่อนุมัติ (Reject)</SelectItem>
                <SelectItem value="DEFER">เลื่อนพิจารณา (Defer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ความคิดเห็น / เงื่อนไข</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึกผล'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}