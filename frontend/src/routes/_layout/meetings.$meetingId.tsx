import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MeetingsService } from '@/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useCustomToast from '@/hooks/useCustomToast'
import { MeetingReviewDialog } from '@/components/Meetings/MeetingReviewDialog'
import { useState } from 'react'

export const Route = createFileRoute('/_layout/meetings/$meetingId')({
  component: MeetingDetailPage,
})

function MeetingDetailPage() {
  const { meetingId } = Route.useParams()
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [reviewProtocolId, setReviewProtocolId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: async () => MeetingsService.readMeeting({ data: { meetingId } }),
  })

  const finalizeMutation = useMutation({
    mutationFn: () => MeetingsService.finalizeMeeting({ data: { meetingId } }),
    onSuccess: () => {
      showSuccessToast('Finalize การประชุมสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
    onError: (err: Error) => showErrorToast(err.message),
  })

  if (isLoading) return <div className="p-6">กำลังโหลด...</div>
  if (error) return <div className="p-6 text-red-500">เกิดข้อผิดพลาด</div>

  const meeting = data?.data
  if (!meeting) return <div className="p-6">ไม่พบการประชุม</div>

  const protocols = meeting.protocols ?? []
  const allReviewed = protocols.length > 0 && protocols.every((p: any) => p.decision)
  const canFinalize = meeting.status === 'SCHEDULED' || meeting.status === 'ONGOING'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={() => navigate({ to: '/meetings' })} className="mb-2 -ml-2">
            ← กลับ
          </Button>
          <h1 className="text-2xl font-bold">{meeting.title || 'การประชุม IRB'}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(meeting.meeting_date).toLocaleDateString('th-TH', { dateStyle: 'full' })}
            {meeting.location && ` • ${meeting.location}`}
          </p>
        </div>
        <Button
          onClick={() => finalizeMutation.mutate()}
          disabled={!canFinalize || !allReviewed || finalizeMutation.isPending}
        >
          {finalizeMutation.isPending ? 'กำลัง Finalize...' : 'Finalize Meeting'}
        </Button>
      </div>

      {/* Quorum Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">องค์ประชุม (Quorum)</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div>
            <p className="text-sm text-muted-foreground">ต้องการ</p>
            <p className="text-2xl font-bold">{meeting.quorum_required}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">มาประชุม</p>
            <p className="text-2xl font-bold">{meeting.present_count ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">สถานะ</p>
            <Badge className={meeting.present_count >= meeting.quorum_required ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {meeting.present_count >= meeting.quorum_required ? 'ครบองค์ประชุม' : 'ยังไม่ครบ'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agenda */}
      <div>
        <h2 className="text-lg font-semibold mb-3">วาระการประชุม ({protocols.length} รายการ)</h2>
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">ชื่อโครงการ</th>
                <th className="px-4 py-3 font-medium">ผู้วิจัย (PI)</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">ผลการพิจารณา</th>
                <th className="px-4 py-3 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {protocols.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-muted-foreground">{p.agenda_order}</td>
                  <td className="px-4 py-3 font-medium">{p.protocol_title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.pi_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {p.protocol_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.decision ? (
                      <Badge className="bg-green-100 text-green-800">{p.decision}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">ยังไม่พิจารณา</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReviewProtocolId(p.protocol_id)}
                      disabled={meeting.status === 'COMPLETED'}
                    >
                      พิจารณา
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MeetingReviewDialog
        meetingId={meetingId}
        protocolId={reviewProtocolId}
        onOpenChange={(open) => !open && setReviewProtocolId(null)}
      />
    </div>
  )
}