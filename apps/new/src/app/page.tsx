import Link from 'next/link';

export default function Home() {
  return (
    <main className="main">
      <div className="hero bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Matchmaking and stats for BF2</h1>
            <p className="py-6">
              This page is currently under development, but it aims to set up mixes
              swiftly with match making functions, as well as provide stats and rankings
              for Battlefield 2.
            </p>
            <Link className="btn btn-primary" href="/results">
              See match results
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
