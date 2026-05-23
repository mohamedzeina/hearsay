import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/app/providers';
import Header from '@/components/header';
import { themeBootScript } from '@/components/theme/theme-provider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hearsay — all opinions welcome',
  description: 'A community discussion platform where every voice gets a thread. Talk about anything, hear what people are actually saying.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <head>
        {/* Runs synchronously before paint. Applies the persisted theme (or
            the system preference) to <html> so dark-mode users don't see a
            light flash before the React provider hydrates. */}
        <script
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
      </head>
      <body className="font-sans min-h-screen text-ink antialiased">
        <Providers>
          <Header />
          <main className="container mx-auto px-4 max-w-6xl">
            {children}
          </main>
          <footer className="border-t border-rule mt-20">
            <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-persimmon" />
                <span className="font-semibold text-ink">Hearsay</span>
                <span className="text-ink-2 text-sm">&mdash; all opinions welcome</span>
              </div>
              <p className="text-xs font-mono text-ink-3">
                &copy; {new Date().getFullYear()} Hearsay
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
