import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      
      {/* Navigation */}
      <header className="relative z-10 flex w-full items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text text-2xl font-bold tracking-tighter text-transparent">
            Neuronix
          </div>
        </div>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 ring-2 ring-slate-800/50 hover:ring-indigo-500 transition-all",
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/sign-in" className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="rounded-full bg-white px-5 py-2.5 text-slate-950 shadow-sm hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            Neuornix OS v2.0 is live
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Your intelligence, <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              amplified by AI.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            The ultimate second brain. Store your notes, documents, and ideas. 
            Search instantly, discover connections seamlessly, and chat with your entire knowledge base.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-6">
            <Link
              href={user ? "/dashboard" : "/sign-up"}
              className="flex h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-8 text-base font-medium text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 sm:w-auto transition-all active:scale-95"
            >
              Get Started for free
            </Link>
            
            <a
              href="#features"
              className="flex h-12 w-full items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 px-8 text-base font-medium text-white hover:bg-slate-800 sm:w-auto transition-all backdrop-blur-sm"
            >
              See how it works
            </a>
          </div>
        </div>
        
        {/* Abstract UI Preview / Graphic */}
        <div className="mt-20 w-full max-w-5xl rounded-t-2xl border border-white/10 bg-slate-900/50 p-2 backdrop-blur-xl sm:p-4 shadow-2xl shadow-indigo-500/10">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
             {/* Mock UI Header */}
             <div className="flex items-center gap-3 mb-8 opacity-50">
                <div className="h-3 w-3 rounded-full bg-slate-700"></div>
                <div className="h-3 w-3 rounded-full bg-slate-700"></div>
                <div className="h-3 w-3 rounded-full bg-slate-700"></div>
             </div>
             {/* Mock UI Content */}
             <div className="grid grid-cols-4 gap-6 h-full opacity-40">
                <div className="col-span-1 space-y-4">
                  <div className="h-4 w-2/3 rounded-md bg-slate-800"></div>
                  <div className="h-4 w-full rounded-md bg-slate-800"></div>
                  <div className="h-4 w-4/5 rounded-md bg-slate-800"></div>
                </div>
                <div className="col-span-3 space-y-6">
                  <div className="h-8 w-1/3 rounded-md bg-slate-800"></div>
                  <div className="h-[200px] w-full rounded-xl bg-slate-800/50 border border-slate-700"></div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
