import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner"; // For premium toast notifications
import { CommandPalette } from "@/components/command/CommandPalette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Use primary email or fallback to first name
  const displayName = user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || "User";

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full opacity-30" />
      </div>

      {/* Primary Dashboard Sidebar */}
      <aside className="relative z-20 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl md:flex flex-shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-xl font-bold tracking-tighter text-transparent">
              Neuronix
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar">
          <SidebarLink href="/dashboard" label="Home" />
          <SidebarLink href="/dashboard/notes" label="Notes" />
          <SidebarLink href="/dashboard/documents" label="Documents" />
          <SidebarLink href="/dashboard/chat" label="AI Assistant" active />
          <SidebarLink href="/dashboard/memory-analytics" label="Memory Intelligence" />
        </nav>
        
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
           <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Sync Active</span>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden h-screen">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/40 px-8 backdrop-blur-md flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <div className="h-4 w-[2px] bg-indigo-500 rounded-full" />
            <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-slate-400">Workspace / <span className="text-slate-100">AI OS</span></h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-bold text-slate-200 tracking-tight">{displayName}</p>
              <p className="text-[10px] font-medium text-slate-500 tabular-nums tracking-wider uppercase">Pro Tier Account</p>
            </div>
            
            <div className="h-8 w-px bg-white/5 mx-1 hidden sm:block"></div>
            
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 ring-1 ring-white/10 hover:ring-indigo-500 transition-all shadow-xl",
                  userButtonPopoverCard: "bg-[#0f0f0f] border border-white/10 shadow-2xl rounded-2xl z-[999] backdrop-blur-xl",
                  userButtonPopoverActionButtonText: "text-slate-300 font-medium",
                  userButtonPopoverActionButtonIcon: "text-slate-400",
                }
              }}
            />
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
      </main>
      
      {/* Command Palette Foundation */}
      <CommandPalette />
      
      {/* Global Toast Provider */}
      <Toaster theme="dark" position="bottom-right" className="!font-sans" />
    </div>
  );
}

function SidebarLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all group relative overflow-hidden ${
        active 
          ? "bg-indigo-500/10 text-white border border-indigo-500/20 shadow-sm" 
          : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
      }`}
    >
      {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r-full" />}
      <span className="relative z-10">{label}</span>
      <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-500 ${active ? "opacity-100" : "group-hover:opacity-100"}`} />
    </Link>
  );
}
