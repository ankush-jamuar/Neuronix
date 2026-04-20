export default function NotesIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 h-full text-center">
      <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      </div>
      <h2 className="text-xl font-medium text-slate-200 mb-2">Select a note</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        Choose a note from the sidebar or create a new one to start writing.
      </p>
    </div>
  );
}
