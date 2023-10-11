import { json, LinksFunction, LoaderArgs, MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from '@remix-run/react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserClient } from '@supabase/auth-helpers-remix';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import styles from './styles/app.css';
import { remixClient } from '@bf2-matchmaking/supabase';
import { PlayerContextProvider } from '~/state/PlayerContext';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }];
};

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'BF2 Matchmaking',
  viewport: 'width=device-width,initial-scale=1',
});

export const loader = async ({ request }: LoaderArgs) => {
  const client = remixClient(request);
  const {
    data: { session: initialSession },
  } = await client.getSession();
  const { data: player } = await client.getPlayerByUserId(initialSession?.user.id);

  return json(
    {
      initialSession,
      player,
      env: {
        SUPABASE_URL: client.SUPABASE_URL,
        SUPABASE_ANON_KEY: client.SUPABASE_ANON_KEY,
      },
    },
    {
      headers: client.response.headers,
    }
  );
};

export default function App() {
  const revalidator = useRevalidator();
  const { env, initialSession, player } = useLoaderData<typeof loader>();
  const [supabaseClient] = useState(() =>
    createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== initialSession?.access_token) {
        revalidator.revalidate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialSession, supabaseClient, revalidator]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
          <PlayerContextProvider player={player}>
            <Header />
            <main className="main">
              <Outlet />
            </main>
          </PlayerContextProvider>
        </SessionContextProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
