import Link from 'next/link';
import React from 'react';

export default function Home() {
  return (
    <main className="main">
      <div className="hero">
        <div className="hero-content text-center">
          <div>
            <h1 className="text-5xl font-bold">Matchmaking and stats for BF2</h1>
            <div className="flex flex-col lg:flex-row gap-8 mt-12">
              <Link className="btn btn-primary w-80 h-40 text-2xl" href="/matches">
                Create match
              </Link>
              <Link className="btn btn-primary w-80 h-40 text-2xl" href="/challenges">
                Challenge team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
