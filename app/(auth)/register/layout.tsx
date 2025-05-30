import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google'; // Import Inter font

const inter = Inter ({ subsets: ['latin'], variable: '--font-sans' }); // Initialize Inter font

export const metadata: Metadata = {
  title: 'GPAC Agenda - Autenticação',
  description: 'Acesse ou crie sua conta no GPAC Agenda',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Use <html> and <body> tags here for a self-contained auth layout
    // Use suppressHydrationWarning for html tag
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex items-center justify-center p-4" , // Added padding for smaller screens
          inter.variable // Apply font variable
        )}
      >
        {/* Main content area */}
        <main className="w-full flex justify-center">
           {children}
        </main>
      </body>
    </html>
  );
}

