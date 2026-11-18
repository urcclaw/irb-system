import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ProtocolsService } from '@/client'

export const Route = createFileRoute('/_layout/protocols/')({
  component: ProtocolsPage,
})

function ProtocolsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['protocols'],
    queryFn: () => ProtocolsService.readProtocols({ skip: 0, limit: 100 }),
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
  const protocols = Array.isArray(data?.data) ? data.data : []
  const count = data?.count ?? 0

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Protocols (รายการคำขอ)</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          + สร้างคำขอใหม่
        </button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อโครงการ</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">ความเสี่ยง</th>
              <th className="px-4 py-3 font-medium">วันที่สร้าง</th>
            </tr>
          </thead>
          <tbody>
            {protocols.map((protocol) => (
              <tr key={protocol.id} className="border-t">
                <td className="px-4 py-3">{protocol.title}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {protocol.status}
                  </span>
                </td>
                <td className="px-4 py-3">{protocol.risk_level || '-'}</td>
                <td className="px-4 py-3">
                  {protocol.created_at 
                    ? new Date(protocol.created_at).toLocaleDateString('th-TH') 
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {count === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          ยังไม่มีรายการคำขอ
        </div>
      )}
    </div>
  )
}