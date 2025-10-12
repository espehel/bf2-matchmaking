import Link from 'next/link';
import React from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/20/solid';
import { isDevelopment } from '@bf2-matchmaking/utils';

export default function Home() {
  return (
    <main className="main">
      <div className="hero">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Matchmaking and stats for BF2</h1>
            <p className="py-6">
              This page is currently under development, but it aims to support mixes with
              stats and rankings, as well as a tool for managing leagues and cups.
            </p>
            <div className="flex flex-col gap-4">
              {isDevelopment() && <Link className="btn btn-primary" href="/challenges">
                Challenge a team
              </Link>}
              <Link className="btn btn-primary" href="/matches">
                Schedule and see matches
              </Link>
              <Link className="btn btn-primary" href="/results">
                Results
              </Link>
              <Link className="btn btn-primary" href="/leaderboards">
                Leaderboards
              </Link>
            </div>
            <p className="mt-8">
              <span className="mr-1">All types of feedback is very welcome</span>
              <Link
                className="link link-primary whitespace-nowrap"
                href="https://discord.com/channels/@me/1057027470655770654"
                target="_blank"
              >
                Contact Artic@discord
                <PaperAirplaneIcon className="size-4 inline ml-1" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
