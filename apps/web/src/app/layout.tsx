import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { PlayerProvider } from '@/state/PlayerContext';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BF2 Matchmaking',
  description: 'BF2 matchmaking, stats and rankings',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerProvider player={player} adminRoles={adminRoles}>
          <Header />
          <div className="mt-8">{children}</div>
          <ToastContainer />
        </PlayerProvider>
      </body>
    </html>
  );
}
