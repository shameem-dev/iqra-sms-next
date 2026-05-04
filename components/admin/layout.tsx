'use client'

import { useState } from "react"
import Sidebar from "./sidebar"
import TopBar from "./topbar"
import StaffUI from "./staffui"
import AdmissionRegisterPage from "./admission"
import AccountsUI from "./accounts"
import MarksEntryPage from "../marks/entry"
import FeeTrackerPage from "./fees/tracker/FeeTracker"
import PaymentPage from "./fees/payment/PaymentMain"
import DocumentGenerator from "./certifictes"
import Dashboard from "./Dashboard"

interface PreselectedStudent {
  id: number
  name: string
  admission_no: string
  standard: string
}

export default function AdminLayout() {
  const [activeTab, setActiveTab]                       = useState<string>("users")
  const [sidebarOpen, setSidebarOpen]                   = useState<boolean>(true)
  const [preselectedStudent, setPreselectedStudent]     = useState<PreselectedStudent | null>(null)

  function goToPayment(student: PreselectedStudent) {
    setPreselectedStudent(student)
    setActiveTab("payment")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "marks":
        return <MarksEntryPage />
      case "fees":
        return <FeeTrackerPage onGoToPayment={goToPayment} />
      case "payment":
        return (
          <PaymentPage
            preselectedStudent={preselectedStudent}
            onBack={() => {
              setPreselectedStudent(null)
              setActiveTab("fees")
            }}
          />
        )
      case "Accounts":
        return <AccountsUI />
      case "staff":
        return <StaffUI />
        case "cerificates & reports":
        return <DocumentGenerator />
      case "admission":
        return <AdmissionRegisterPage />
        default:
        return <Dashboard />
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