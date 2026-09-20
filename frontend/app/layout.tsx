import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokePedia",
  description: "The Ultimate Pokedex",
  icons: {
    icon: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-center" duration={1500} closeButton />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
