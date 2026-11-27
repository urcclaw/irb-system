import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { MeetingsService, type MeetingPublic } from '@/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { MeetingCreateDialog } from '@/components/Meetings/MeetingCreateDialog'

export const Route = createFileRoute('/_layout/meetings')({
  component: MeetingsPage,
})

function MeetingsPage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      return MeetingsService.readMeetings({
        query: { skip: 0, limit: 100 }
      })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg border border-red-200">
        <p className="font-bold">เกิดข้อผิดพลาด:</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    )
  }

  const responseBody = data?.data
  const meetings: MeetingPublic[] = Array.isArray(responseBody?.data) ? responseBody.data : []
  const count = responseBody?.count ?? 0

  // Badge color ตามสถานะ
  const statusVariant = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'ONGOING': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">การประชุม IRB</h1>
          <p className="text-sm text-muted-foreground">ทั้งหมด {count} รายการ</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ สร้างการประชุมใหม่</Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อการประชุม</th>
              <th className="px-4 py-3 font-medium">วันที่</th>
              <th className="px-4 py-3 font-medium">ประเภท</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium text-center">วาระ</th>
              <th className="px-4 py-3 font-medium text-center">องค์ประชุม</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {meetings.map((meeting) => (
              <tr
                key={meeting.id}
                onClick={() => navigate({ to: '/meetings/$meetingId', params: { meetingId: meeting.id } })}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">
                  {meeting.title || `การประชุม ${formatDate(meeting.meeting_date)}`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(meeting.meeting_date)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {meeting.meeting_type === 'FULL_BOARD' ? 'Full Board' : 'Expedited'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusVariant(meeting.status)}`}>
                    {meeting.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{meeting.protocol_count ?? 0}</td>
                <td className="px-4 py-3 text-center">
                  <span className={meeting.present_count >= meeting.quorum_required ? 'text-green-600' : 'text-red-600'}>
                    {meeting.present_count ?? 0}/{meeting.quorum_required}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {count === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
          ยังไม่มีข้อมูลการประชุม
        </div>
      )}

      <MeetingCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}