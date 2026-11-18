import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ReviewAssignmentsService } from '@/client'

export const Route = createFileRoute('/_layout/review-assignments')({
  component: ReviewAssignmentsPage,
})

function ReviewAssignmentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['review-assignments'],
    queryFn: () => ReviewAssignmentsService.readReviewAssignments({ skip: 0, limit: 100 }),
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
      <div className="p-6 text-red-500">
        Error: {(error as Error).message}
      </div>
    )
  }

  // Guard: ตรวจสอบว่า data.data เป็น Array จริงๆ
  const assignments = Array.isArray(data?.data) ? data.data : []
  const count = data?.count ?? 0

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Assignments (งานตรวจสอบ)</h1>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID การมอบหมาย</th>
              <th className="px-4 py-3 font-medium">Protocol ID</th>
              <th className="px-4 py-3 font-medium">Reviewer ID</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">กำหนดส่ง</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{assignment.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-mono text-xs">{assignment.protocol_id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-mono text-xs">{assignment.reviewer_id.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    assignment.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800' 
                      : assignment.status === 'IN_PROGRESS'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {assignment.due_date 
                    ? new Date(assignment.due_date).toLocaleDateString('th-TH') 
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {count === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          ยังไม่มีงานที่ได้รับมอบหมาย
        </div>
      )}
    </div>
  )
}