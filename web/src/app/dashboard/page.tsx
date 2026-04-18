import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-4 bg-slate-900/50 backdrop-blur">
        <h1 className="text-xl font-semibold text-white tracking-tight">Neuronix OS</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-slate-400">{user.primaryEmailAddress?.emailAddress}</p>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-8 mt-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user.firstName || 'User'}!</h2>
            <p className="text-slate-400 text-lg">Manage your second brain efficiently.</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
              <h3 className="font-semibold text-slate-200">Recent Notes</h3>
              <p className="mt-2 text-sm text-slate-400">You have no recent notes.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
              <h3 className="font-semibold text-slate-200">Documents</h3>
              <p className="mt-2 text-sm text-slate-400">0 documents stored securely.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
              <h3 className="font-semibold text-slate-200">Chat Sessions</h3>
              <p className="mt-2 text-sm text-slate-400">Start an AI session.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
