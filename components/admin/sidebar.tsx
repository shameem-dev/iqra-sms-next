"use client";
import {
  Users,
  Calendar,
  Clock,
  FileText,
  BarChart3,
  ChevronRight,
  Upload,
  LogOut,
  PanelLeftClose,
  Book,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SIDEBAR_ITEMS = [
  { id: "users", label: "User Management", icon: Users, badge: null },
  {
    id: "timetable",
    label: "Timetable Generator",
    icon: Calendar,
    badge: null,
  },
  { id: "import", label: "Import Students", icon: Upload, badge: null },
  { id: "attendance", label: "Student Attendance", icon: Clock, badge: null },
  { id: "leave", label: "Leave Requests", icon: FileText, badge: "NEW" },
  { id: "reports", label: "Reports", icon: BarChart3, badge: null },
  { id: "subjects", label: "Subjects", icon: Book, badge: null },
  { id: "staff", label: "Staff Data", icon: Users, badge: null },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab = "users",
  setActiveTab,
  sidebarOpen = true,
  setSidebarOpen,
}: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  const handleLogoClick = () => {
    if (!sidebarOpen && setSidebarOpen) {
      setSidebarOpen(true);
    }
  };

  const handleNavItemClick = (id: string) => {
    if (typeof setActiveTab === "function") {
      setActiveTab(id);
    }
  };

  const handleCollapseClick = () => {
    if (typeof setSidebarOpen === "function") {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={`${sidebarOpen ? "w-72" : "w-20"} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col border-r border-slate-700 h-screen`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-700 flex items-center gap-2">
        {/* Logo - clicking expands sidebar when collapsed */}
        <div
          onClick={handleLogoClick}
          className={`flex items-center gap-3 flex-1 min-w-0 rounded-lg transition-all ${
            !sidebarOpen ? "cursor-pointer hover:opacity-80" : "cursor-default"
          }`}
          title={!sidebarOpen ? "Expand sidebar" : undefined}
        >
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="w-10 h-10"
            />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">IQRAH School</div>
              <div className="text-xs text-slate-400 truncate">
                Admin Portal
              </div>
            </div>
          )}
        </div>

        {/* Collapse icon - only shown when sidebar is open */}
        {sidebarOpen && (
          <button
            onClick={handleCollapseClick}
            className="flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all flex-shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavItemClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative ${
              sidebarOpen ? "justify-start" : "justify-center"
            } ${
              activeTab === item.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon size={22} className="flex-shrink-0" />
            {sidebarOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {activeTab === item.id && sidebarOpen && (
              <ChevronRight
                size={16}
                className="absolute right-2 text-indigo-300"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Footer - Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        {sidebarOpen ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between gap-2 px-3 py-3 text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all font-medium text-sm"
          >
            <span>Logout</span>
            <LogOut size={18} />
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
}