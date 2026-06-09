import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WorkspaceProvider } from "@/app/context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";

import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klixsoft Project Management Portal",
  description: "Unified Kanban Board & Discord Communication Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased font-sans">
        <WorkspaceProvider>
          <TooltipProvider delayDuration={150}>
            <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
              <Sidebar />
              <main className="flex-1 flex flex-col h-full overflow-hidden">
                {children}
              </main>
            </div>
            <Toaster richColors closeButton />
          </TooltipProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
