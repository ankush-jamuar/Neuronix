import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner"; // For premium toast notifications
import AIChat from "@/components/ai/AIChat";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Use primary email or fallback to first name
  const displayName = user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || "User";

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a] text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar / Vertical Nav */}
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md md:flex">
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/" className="bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text text-xl font-bold tracking-tighter text-transparent">
            Neuronix
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/dashboard/notes" className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            Notes
          </Link>
          <Link href="/dashboard/documents" className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            Documents
          </Link>
          <Link href="/dashboard/chat" className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            Chat Assistant
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden relative max-w-full">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 px-6 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight text-slate-200">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-200">{displayName}</p>
              <p className="text-xs text-slate-500">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
            
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 ring-2 ring-slate-800 hover:ring-indigo-500 transition-all",
                  userButtonPopoverCard: "bg-[#111] border border-white/10 shadow-2xl rounded-xl z-[999]",
                  userButtonPopoverActionButtonText: "text-slate-300 font-medium",
                  userButtonPopoverActionButtonIcon: "text-slate-400",
                }
              }}
            />
          </div>
        </header>

        {/* Page Content injected here — children own their own layout/scroll */}
        <div className="flex-1 overflow-hidden flex flex-row">
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
          <AIChat />
        </div>
      </main>
      
      {/* Global Toast Provider */}
      <Toaster theme="dark" position="bottom-right" className="!font-sans" />
    </div>
  );
}
