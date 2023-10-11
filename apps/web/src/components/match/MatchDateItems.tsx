import { ScheduledMatch } from '@bf2-matchmaking/types';
import moment from 'moment/moment';
import Link from 'next/link';
import ScheduledMatchCard from '@/components/ScheduledMatchCard';

interface Props {
  date: string;
  matches: Array<ScheduledMatch>;
}

export default function MatchDateItems({ date, matches }: Props) {
  const thisDaysMatches = matches.filter(
    (match) => moment(match.scheduled_at).date() === moment(date).date()
  );
  return (
    <>
      <li className="font-extrabold text-left">{moment(date).format('dddd, MMMM Do')}</li>
      {thisDaysMatches.map((match) => (
        <li className="" key={match.id}>
          <Link href={`/matches/${match.id}`}>
            <ScheduledMatchCard match={match} />
          </Link>
        </li>
      ))}
    </>
  );
}
