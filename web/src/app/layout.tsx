import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neuronix",
  description: "AI-Powered Personal Knowledge OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{ 
        baseTheme: dark,
        variables: {
          colorPrimary: '#4f46e5', // High contrast indigo
          colorBackground: '#09090b', // Deep sleek dark background
          colorText: '#f8fafc', // Hard white text
          colorTextSecondary: '#a1a1aa', // Visible gray secondary
          colorInputBackground: '#18181b', // Input box shading
          colorInputText: '#f8fafc', // Input text color
          colorNeutral: '#a1a1aa', // Neutral borders
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          borderRadius: '0.75rem',
        },
        layout: {
          socialButtonsPlacement: 'bottom',
        },
        elements: {
          cardBox: "shadow-2xl shadow-indigo-500/10 rounded-2xl border border-white/10",
          card: "bg-[#09090b]",
          headerTitle: "text-slate-50 font-bold",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton: "bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-slate-50 transition-all shadow-sm",
          socialButtonsBlockButtonText: "font-medium text-slate-50",
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 font-medium normal-case text-white border-none shadow-md transition-all",
          footerActionLink: "text-indigo-400 hover:text-indigo-300 font-medium",
          identityPreviewText: "text-slate-50 font-medium",
          identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
          formFieldLabel: "text-slate-200 font-medium",
          formFieldInput: "bg-[#18181b] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
          dividerLine: "bg-white/10",
          dividerText: "text-slate-400",
          userButtonPopoverCard: "bg-[#09090b] border border-white/10 shadow-2xl rounded-xl z-50",
          userButtonPopoverActionButton: "hover:bg-white/5 transition-colors",
          userButtonPopoverActionButtonText: "text-slate-200 font-medium",
          userButtonPopoverActionButtonIcon: "text-slate-400",
          formFieldWarningText: "text-orange-400",
          formFieldErrorText: "text-red-400",
        }
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col bg-[#09090b] text-slate-50 selection:bg-indigo-500/30">{children}</body>
      </html>
    </ClerkProvider>
  );
}
