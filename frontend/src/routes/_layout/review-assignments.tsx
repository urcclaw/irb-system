import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ReviewAssignmentsService } from '@/client'
import { CreateAssignmentDialog } from '@/components/ReviewAssignments/CreateAssignmentDialog'

export const Route = createFileRoute('/_layout/review-assignments')({
  component: ReviewAssignmentsPage,
})

function ReviewAssignmentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['review-assignments'],
    queryFn: async () => {
      return ReviewAssignmentsService.assignmentsReadReviewAssignments({
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

  // เข้าถึง data ซ้อน 2 ชั้น เพราะ @hey-api/openapi-ts ห่อ response ด้วย Axios
  const responseBody = data?.data
  const assignments = Array.isArray(responseBody?.data) ? responseBody.data : []
  const count = responseBody?.count ?? 0

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Assignments (งานตรวจสอบ)</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">ทั้งหมด {count} รายการ</span>
          <CreateAssignmentDialog />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID การมอบหมาย</th>
              <th className="px-4 py-3 font-medium">โครงการวิจัย</th>
              <th className="px-4 py-3 font-medium">ผู้ตรวจสอบ</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">กำหนดส่ง</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assignments.map((assignment: any) => (
              <tr key={assignment.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {assignment.id ? `${assignment.id.slice(0, 8)}...` : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {/* แสดงชื่อ Protocol ถ้ามี */}
                  {assignment.protocol_title ? (
                    <span className="font-medium text-foreground" title={assignment.protocol_title}>
                      {assignment.protocol_title.length > 40
                        ? `${assignment.protocol_title.slice(0, 40)}...`
                        : assignment.protocol_title}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      {assignment.protocol_id ? `${assignment.protocol_id.slice(0, 8)}...` : 'N/A'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {/* แสดงชื่อ Reviewer ถ้ามี */}
                  {assignment.reviewer_name ? (
                    <span className="font-medium text-foreground">
                      {assignment.reviewer_name}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      {assignment.reviewer_id ? `${assignment.reviewer_id.slice(0, 8)}...` : 'N/A'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : assignment.status === 'IN_PROGRESS'
                      ? 'bg-yellow-100 text-yellow-800'
                      : assignment.status === 'PENDING'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.status || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {assignment.due_date
                    ? new Date(assignment.due_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {count === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
          ยังไม่มีงานที่ได้รับมอบหมาย
        </div>
      )}
    </div>
  )
}