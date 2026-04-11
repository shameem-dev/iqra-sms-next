

export default function SchoolSidebar() {
  const modules = [
    'Home',
    'Fees Module',
    'Admission Register',
    'Accounts',
    'Staff Data',
    'Marks',
    'Student Attendance',
    'Certificates & Reports',
    'Achievements',
  ];


  return (
    
    <aside className="w-72 min-h-screen border-r p-6 shadow-sm bg-blue-100">
      <h1 className="text-2xl font-bold text-black">IQRAH School</h1>
      <p className="text-sm text-gray-500 mt-0.5">School Management System</p>

      <nav className="mt-8 space-y-2">
        {modules.map((item) => (
          <button
            key={item}
            className={`w-full text-left text-black px-4 py-3 rounded-2xl hover:bg-slate-100 transition font-medium`}
           >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
