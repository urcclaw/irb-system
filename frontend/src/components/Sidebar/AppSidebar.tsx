import { Home, Users, FileText, ClipboardCheck } from 'lucide-react'

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  // 1. เมนูพื้นฐานสำหรับทุกคน
  const baseItems: Item[] = [
    { icon: Home, title: "Dashboard", path: "/" },
    { icon: FileText, title: "Protocols", path: "/protocols" }, // เปลี่ยนจาก Items เป็น Protocols
  ]

  // 2. เมนูเพิ่มเติมสำหรับเลขาฯ และ Reviewer
  const reviewItems: Item[] = []
  if (currentUser?.role === "SECRETARY" || currentUser?.role === "REVIEWER") {
    reviewItems.push({ 
      icon: ClipboardCheck, 
      title: "Review Assignments", 
      path: "/review-assignments" 
    })
  }

  // 3. รวมเมนูทั้งหมด
  const items = currentUser?.is_superuser
    ? [...baseItems, ...reviewItems, { icon: Users, title: "Admin", path: "/admin" }]
    : [...baseItems, ...reviewItems]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar