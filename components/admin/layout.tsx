"use client"
import { useState } from "react"
import Sidebar from "./sidebar"
import TopBar from "./topbar"

import StaffUI from "./staffui"
import AdmissionRegisterPage from "./admission"
import FeesDashboard from "./fees/FeesDashboard"
import AccountsUI from "./accounts"


const SECTIONS: Record<string, { label: string }> = {
  users: { label: "User Management" },
  Accounts: { label: "Accounts" },
  import: { label: "Import Students" },
  attendance: { label: "Student Attendance" },
  leave: { label: "Leave Requests" },
  reports: { label: "Reports" },
  subjects: { label: "Subjects" },
  staff: { label: "Staff Data" },
}

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState<string>("users")
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  const renderContent = () => {
    switch (activeTab) {
    //   case "users":
    //     return <UsersSection />
    
    //   case "import":
    //     return <StudentsImportSection />
    //   case "subjects":
    //     return <BatchSubjectSection />
    case "fees":
       return <FeesDashboard />
      case "Accounts":
return <AccountsUI/>;
    case "staff":
        return <StaffUI />
    case "admission-register":
        return <AdmissionRegisterPage/>

    //   case "attendance":
    //     return <AdminAttendanceSection />
    //   default:
    //     return <UsersSection />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}