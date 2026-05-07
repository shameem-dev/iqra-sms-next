"use client"
import { useRouter } from "next/navigation"
import { Menu, Bell, Settings, LogOut, ChevronDown, Home } from "lucide-react"
import { useState } from "react"

const SECTIONS: Record<string, string> = {
  users: "Dashboard",
  Accounts: "Accounts",
  attendance: "Student Attendance",
  leave: "Leave Requests",
  reports: "Reports",
  admission: "Admission Register",
  staff: "Staff Management",
  marks: "Marks",
  "certificates & reports": "Certificates & Reports",
}

const descriptions: Record<string, string> = {
  users: "Access your dashboard and manage your institution",
  Accounts: "Manage financial records and transactions",
  attendance: "Track student attendance and generate reports",
  leave: "Approve and manage leave requests",
  reports: "Generate reports and analytics",
  admission: "Manage student admissions and parent login access",
  staff: "Manage staff members and their details",
  marks: "Enter and manage student marks and assessments",
  "certificates & reports": "Generate certificates and progress reports",
}

interface TopBarProps {
  activeTab: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function TopBar({ activeTab, sidebarOpen, setSidebarOpen }: TopBarProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [hasNotifications] = useState(true)

  const admin = {
    name: "Admin User",
    email: "admin@iqrah.edu",
    role: "Administrator",
    initials: "AU",
  }

  const currentSection = SECTIONS[activeTab] || "Dashboard"
  const currentDescription = descriptions[activeTab] || "Manage your institution effectively"

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
        {/* Left — hamburger + breadcrumb + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
              <Home size={11} />
              <span>/</span>
              <span className="truncate">{currentSection}</span>
            </div>

            {/* Page title + description inline */}
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-[15px] font-semibold text-gray-900 whitespace-nowrap">
                {currentSection}
              </h1>
              <span className="hidden sm:block text-xs text-gray-400 truncate">
                — {currentDescription}
              </span>
            </div>
          </div>
        </div>

        {/* Right — actions + profile */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {/* Notification bell */}
      

          {/* Separator */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Profile trigger */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2.5 h-9 pl-1 pr-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[11px] font-semibold tracking-wide shrink-0">
                {admin.initials}
              </div>

              {/* Name + role */}
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[13px] font-medium text-gray-900">{admin.name}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{admin.role}</span>
              </div>

            </button>

         
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {profileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
      )}
    </>
  )
}

// ─── Dropdown item sub-component ───────────────────────────────────────────
interface DropdownItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}

function DropdownItem({ icon, label, onClick, danger }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors text-left ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="w-4 flex items-center justify-center shrink-0">{icon}</span>
      {label}
    </button>
  )
}