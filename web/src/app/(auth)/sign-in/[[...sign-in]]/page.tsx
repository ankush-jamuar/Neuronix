import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#09090b] overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="relative z-10 scale-105 sm:scale-110">
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
