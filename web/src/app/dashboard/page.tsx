import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-10">
      
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
  );
}
