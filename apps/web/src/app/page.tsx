import Link from 'next/link';

export default function Home() {
  return (
    <main className="main">
      <div className="hero bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Matchmaking and stats for BF2</h1>
            <p className="py-6">
              This page is currently under development, but it aims to support mixes with
              stats and rankings, as well as a tool for managing leagues and cups.
            </p>
            <div className="flex flex-col gap-4">
              <Link className="btn btn-primary" href="/matches/scheduled">
                Scheduled matches
              </Link>
              <Link className="btn btn-primary" href="/matches">
                Live matches
              </Link>
              <Link className="btn btn-primary" href="/results/leagues/16">
                PB 8v8 League
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
