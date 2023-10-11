import { TeamsJoined } from '@bf2-matchmaking/types';

interface AvatarProps {
  team: TeamsJoined;
}
export function TeamAvatar({ team }: AvatarProps) {
  /*if (team.avatar) {
      return (
        <div className="avatar">
          <div className="w-24 rounded-full">
            <Image src={team.avatar} alt="avatar" fill={true} />
          </div>
        </div>
      );
    }*/
  return (
    <div className="avatar placeholder">
      <div className="bg-neutral-focus text-neutral-content rounded-full w-24">
        <span className="text-3xl">{team.name.charAt(0)}</span>
      </div>
    </div>
  );
}
