'use server';

import { cookies } from 'next/headers';

const SELECTED_TEAM_COOKIE = 'selected_team_id';

export async function setSelectedTeam(teamId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_TEAM_COOKIE, teamId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function getSelectedTeamId(): Promise<number | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SELECTED_TEAM_COOKIE)?.value;
  return value ? parseInt(value, 10) : null;
}
