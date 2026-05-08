"use client";
import {
  Users,
  FileSpreadsheet,
  Clock,
  FileText,
  BarChart3,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  ClipboardPlus,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

const SIDEBAR_ITEMS = [
  { id: "users", label: "Dashboard", icon: Users, badge: null },
  { id: "Accounts", label: "Accounts", icon: FileSpreadsheet, badge: null },
  { id: "attendance", label: "Student Attendance", icon: Clock, badge: null },
  { id: "marks", label: "Marks", icon: FileText, badge: "" },
  { id: "fees", label: "Fees", icon: BarChart3, badge: null },
  { id: "admission", label: "Admission Register", icon: ClipboardPlus, badge: null },
  { id: "staff", label: "Staff Management", icon: Users, badge: null },
  { id: "certificates & reports", label: "Certificates & Reports", icon: BarChart3, badge: null },
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
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login"; // hard redirect clears all client state
  };

  const handleLogoClick = () => { if (!sidebarOpen) setSidebarOpen(true); };
  const handleNavItemClick = (id: string) => { if (typeof setActiveTab === "function") setActiveTab(id); };
  const handleCollapseClick = () => { if (typeof setSidebarOpen === "function") setSidebarOpen(false); };

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } flex flex-col h-screen transition-all duration-300 bg-gradient-to-b from-[#0a1e4f] via-[#112d72] to-[#0b2458]`}
    >
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-[#c49a28]/30">
        <div
          onClick={handleLogoClick}
          className={`flex items-center gap-3 flex-1 min-w-0 ${
            !sidebarOpen ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white/5">
            <Image
              src="/images/logo.png"
              alt="IQRAH Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-md"
            />
          </div>

          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm tracking-[0.12em] uppercase truncate">
                IQRAH
              </div>
              <div className="text-[#c49a28] text-[9px] tracking-[0.15em] uppercase truncate">
                Admin Portal
              </div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <button
            onClick={handleCollapseClick}
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 border border-[#c49a28]/30 text-[#c49a28]/70 hover:text-[#c49a28] hover:bg-[#c49a28]/10 transition-all"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 [scrollbar-width:none]">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative text-[13px] border-l-[3px] ${
                sidebarOpen ? "justify-start" : "justify-center"
              } ${
                isActive
                  ? "bg-gradient-to-r from-[#c49a28]/20 to-[#c49a28]/5 border-[#c49a28] text-white font-medium"
                  : "border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              {/* Icon box */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isActive ? "bg-[#c49a28]/20" : "bg-white/5"
                }`}
              >
                <item.icon
                  size={15}
                  className={isActive ? "text-[#c49a28]" : ""}
                />
              </div>

              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#c49a28] text-[#0b2255]">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight
                      size={13}
                      className="absolute right-2 text-[#c49a28]"
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[#c49a28]/30">
        {sidebarOpen ? (
          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#c49a28] bg-[#c49a28]/10 border border-[#c49a28]/30 hover:bg-[#c49a28]/20 transition-all"
          >
            <span>Logout</span>
            <LogOut size={16} />
          </button>
        ) : (
          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center justify-center p-3 rounded-xl text-[#c49a28] hover:bg-[#c49a28]/10 transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );
}