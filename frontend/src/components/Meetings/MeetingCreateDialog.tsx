import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MeetingsService } from '@/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCustomToast } from '@/hooks/useCustomToast'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeetingCreateDialog({ open, onOpenChange }: Props) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: any) => MeetingsService.createMeeting({ data }),
    onSuccess: () => {
      showSuccessToast('สร้างการประชุมสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      onOpenChange(false)
    },
    onError: (err: Error) => showErrorToast(err.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    mutation.mutate({
      title: form.get('title') as string,
      meeting_date: new Date(form.get('meeting_date') as string).toISOString(),
      meeting_type: form.get('meeting_type') as string,
      location: form.get('location') as string,
      quorum_required: Number(form.get('quorum_required') || 1),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างการประชุมใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>ชื่อการประชุม</Label>
            <Input name="title" placeholder="ประชุม IRB ครั้งที่ 1/2569" required />
          </div>
          <div>
            <Label>วันที่ประชุม</Label>
            <Input name="meeting_date" type="datetime-local" required />
          </div>
          <div>
            <Label>ประเภท</Label>
            <Select name="meeting_type" defaultValue="FULL_BOARD">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_BOARD">Full Board</SelectItem>
                <SelectItem value="EXPEDITED">Expedited</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>สถานที่</Label>
            <Input name="location" placeholder="ห้องประชุม 1" />
          </div>
          <div>
            <Label>องค์ประชุมขั้นต่ำ</Label>
            <Input name="quorum_required" type="number" defaultValue={3} min={1} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'กำลังบันทึก...' : 'สร้างการประชุม'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}