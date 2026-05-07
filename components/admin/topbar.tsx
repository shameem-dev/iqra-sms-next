"use client"
import { useRouter } from "next/navigation"
import { Menu, Bell, Settings, LogOut, ChevronDown } from "lucide-react"
import { useState } from "react"
import { register } from "module"

const SECTIONS: Record<string, string> = {
  users: "Dashboard",
  Accounts: "Accounts",
  attendance: "Student Attendance",
  leave: "Leave Requests",
  reports: "Reports",
  admission: "Admission Register",
  staff: "Staff Data",
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
  "certificates & reports": "Generate certificates and reports"
}

interface TopBarProps {
  activeTab: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function TopBar({ activeTab, sidebarOpen, setSidebarOpen }: TopBarProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    router.push("/login")
  }

  const admin = {
    name: "Admin User",
    email: "admin@iqrah.edu",
    role: "Administrator",
    avatar: "AU"
  }

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {SECTIONS[activeTab] || "Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">
              {descriptions[activeTab] || "Manage your institution effectively"}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Profile & Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {admin.avatar}
            </div>

            {/* Profile Info */}
            <div className="hidden sm:flex flex-col items-start">
              <p className="text-sm font-semibold text-gray-900">{admin.name}</p>
              <p className="text-xs text-gray-500">{admin.role}</p>
            </div>

            {/* Chevron */}
            <ChevronDown
              size={18}
              className={`text-gray-600 transition-transform ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              {/* Profile Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {admin.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{admin.name}</p>
                    <p className="text-xs text-gray-600">{admin.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    router.push("/admin/profile")
                    setProfileOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-xs">👤</span>
                  </div>
                  View Profile
                </button>

                <button
                  onClick={() => {
                    router.push("/admin/settings")
                    setProfileOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings size={16} className="text-gray-600" />
                  </div>
                  Settings
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={() => {
                    handleLogout()
                    setProfileOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut size={16} className="text-red-600" />
                  </div>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </div>
  )
}