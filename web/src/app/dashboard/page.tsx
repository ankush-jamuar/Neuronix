import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Use primary email or fallback to first name
  const displayName = user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || "User";

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a] text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar / Vertical Nav (Mockup for SaaS layout) */}
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md md:flex">
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/" className="bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text text-xl font-bold tracking-tighter text-transparent">
            Neuronix
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-colors">
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

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight text-slate-200">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-200">{displayName}</p>
              <p className="text-xs text-slate-500">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
            
            {/* Highly customized UserButton for polish */}
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 ring-2 ring-slate-800 hover:ring-indigo-500 transition-all",
                  userButtonPopoverCard: "bg-[#111] border border-white/10 shadow-2xl rounded-xl",
                  userButtonPopoverActionButtonText: "text-slate-300 font-medium",
                  userButtonPopoverActionButtonIcon: "text-slate-400",
                }
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-10 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-10">
            
            {/* Greeting */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                Welcome back, {user.firstName || 'there'} 👋
              </h2>
              <p className="text-slate-400 text-lg">
                Here's a summary of your second brain today.
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:bg-white/[0.05]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <h3 className="font-medium text-slate-400 text-sm mb-1">Total Notes</h3>
                <p className="text-3xl font-semibold text-white">0</p>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:bg-white/[0.05]">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <h3 className="font-medium text-slate-400 text-sm mb-1">Documents Stored</h3>
                <p className="text-3xl font-semibold text-white">0</p>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:bg-white/[0.05]">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <h3 className="font-medium text-slate-400 text-sm mb-1">Active Chats</h3>
                <p className="text-3xl font-semibold text-white">0</p>
              </div>
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-[#111] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-200">Recent Activity</h3>
                </div>
                <div className="flex flex-col items-center justify-center p-10 mt-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                  <p className="text-sm text-slate-500">No recent activity yet.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#111] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-200">Get Started</h3>
                </div>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06] text-left">
                    <div>
                      <h4 className="text-sm font-medium text-white">Create a New Note</h4>
                      <p className="text-xs text-slate-500 mt-1">Start writing or connect ideas.</p>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">+</div>
                  </button>
                  <button className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06] text-left">
                    <div>
                      <h4 className="text-sm font-medium text-white">Upload Document</h4>
                      <p className="text-xs text-slate-500 mt-1">Add PDFs or images to your brain.</p>
                    </div>
                    <div className="bg-sky-500/10 text-sky-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">↑</div>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
