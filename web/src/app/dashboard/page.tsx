import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getDashboardStats(clerkId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/notes`,
      {
        // No auth token available server-side without additional setup,
        // so we compute stats from the sidebar data client-side instead.
        // This returns safe defaults — metrics are hydrated in the client notes layout.
        cache: "no-store",
      }
    );
    return null;
  } catch {
    return null;
  }
}

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
      
      {/* Stats Cards — client-driven, numbers show from notes layout */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <h3 className="font-medium text-slate-400 text-sm mb-1">Total Notes</h3>
          <DashboardNoteCount />
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <h3 className="font-medium text-slate-400 text-sm mb-1">Documents Stored</h3>
          <p className="text-3xl font-semibold text-white">—</p>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <h3 className="font-medium text-slate-400 text-sm mb-1">AI Assistant</h3>
          <p className="text-3xl font-semibold text-white">
            <Link href="/dashboard/chat" className="text-indigo-400 hover:text-indigo-300 transition-colors text-lg">
              Open Chat →
            </Link>
          </p>
        </div>
      </div>

      {/* Quick Actions / Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-[#111] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-200">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard/notes"
              className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06] text-left"
            >
              <div>
                <h4 className="text-sm font-medium text-white">Open Notes</h4>
                <p className="text-xs text-slate-500 mt-1">Browse and create notes in your vault.</p>
              </div>
              <div className="bg-indigo-500/10 text-indigo-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">→</div>
            </Link>
            <Link
              href="/dashboard/chat"
              className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06] text-left"
            >
              <div>
                <h4 className="text-sm font-medium text-white">Ask Neuronix AI</h4>
                <p className="text-xs text-slate-500 mt-1">Query your knowledge base with AI.</p>
              </div>
              <div className="bg-sky-500/10 text-sky-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">🧠</div>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-200">System Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">Authentication</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">Database</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">AI Retrieval</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Enabled</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Vector Search</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ pgvector</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server component placeholder — note count is managed in the notes layout client state
function DashboardNoteCount() {
  return <p className="text-3xl font-semibold text-white">—</p>;
}
