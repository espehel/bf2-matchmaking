import RevalidateForm from '@/components/RevalidateForm';

interface Props {
  matchId: number;
  city: string;
}
export default function ServerInstancePending({ matchId, city }: Props) {
  return (
    <section className="section max-w-md text-left">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-xl">{`Generating server in ${city}...`}</h2>
        <RevalidateForm path={`/matches/${matchId}`} />
      </div>
    </section>
  );
}
