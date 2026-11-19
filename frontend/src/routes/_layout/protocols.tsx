import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ProtocolsService } from '@/client'

export const Route = createFileRoute('/_layout/protocols')({
  component: ProtocolsPage,
})

function ProtocolsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['protocols'],
    queryFn: async () => {
      // ✅ แก้ไข 1: ต้องส่ง parameter ผ่าน object { query: { ... } }
      return ProtocolsService.readProtocols({
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

  // ✅ แก้ไข 2: เข้าถึง data ซ้อน 2 ชั้น เพราะ Axios ห่อ response ไว้
  const responseBody = data?.data
  const protocols = Array.isArray(responseBody?.data) ? responseBody.data : []
  const count = responseBody?.count ?? 0

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">โครงการวิจัย (Protocols)</h1>
        <span className="text-sm text-muted-foreground">ทั้งหมด {count} รายการ</span>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อโครงการ</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">ระดับความเสี่ยง</th>
              <th className="px-4 py-3 font-medium">ประเภทการตรวจสอบ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {protocols.map((protocol: any) => (
              <tr key={protocol.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {protocol.title.length > 50 
                    ? `${protocol.title.slice(0, 50)}...` 
                    : protocol.title}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {protocol.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {protocol.risk_level || '-'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {protocol.review_type || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {count === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
          ยังไม่มีโครงการวิจัย
        </div>
      )}
    </div>
  )
}