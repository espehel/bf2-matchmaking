import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { PlayerProvider } from '@/state/PlayerContext';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import ThemeButton from '@/components/ThemeButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BF2 Matchmaking',
  description: 'BF2 matchmaking, stats and rankings',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();

  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerProvider player={player} adminRoles={adminRoles}>
          <Header />
          <div>{children}</div>
          <ToastContainer />
        </PlayerProvider>
        <ThemeButton />
      </body>
    </html>
  );
}
