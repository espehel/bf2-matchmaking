import { MatchConfigsRow } from '@bf2-matchmaking/types';
import { session } from '@/lib/supabase/supabase-server';
import { getGuildMember } from '@bf2-matchmaking/discord';
import { api, assertString, verify } from '@bf2-matchmaking/utils';
import Link from 'next/link';
import { getUser } from '@bf2-matchmaking/teamspeak/api';
import { TEAMSPEAK_SERVER_URI } from '@bf2-matchmaking/teamspeak';
import SearchParamToggle from '@/components/gather/SearchParamToggle';

interface Props {
  config: MatchConfigsRow;
  serverAddress: string;
}
export default async function ConnectionsSection({ config, serverAddress }: Props) {
  assertString(config.guild, 'Guild ID is not defined in match config');

  const player = await session.getSessionPlayer();
  const { data: guildMember } = await getGuildMember(config.guild, player.id);
  const teamspeak = undefined; //player.teamspeak_id ? await getUser(player.teamspeak_id) : undefined;

  const server = await api.v2.getServer(serverAddress).then(verify);
  const isConnectedBf2Server = server.live?.players.some(
    (player) => player.keyhash === player.keyhash
  );

  return (
    <section className="section">
      <h2>Connections</h2>
      <h3>Discord</h3>
      {guildMember ? (
        <>
          <p>{guildMember.nick || guildMember.user.global_name || 'unknown'}</p>
          <Link
            className="link"
            href={`https://discord.com/channels/${config.guild}/${config.channel}`}
            target="_blank"
          >
            Go to discord
          </Link>
        </>
      ) : (
        <Link className="link" href="https://discord.gg/FK2fhUgdFu" target="_blank">
          Join discord
        </Link>
      )}
      <h3>Teamspeak</h3>
      <p>Link to setup teamspeak id</p>
      {teamspeak ? (
        <p>{/*teamspeak.channelGroupId*/}not happening</p>
      ) : (
        <Link className="link" href={TEAMSPEAK_SERVER_URI}>
          Connect
        </Link>
      )}
      <h3>BF2 Server</h3>
      <p>Link to setup keyhash</p>
      {isConnectedBf2Server ? <p>Connected</p> : <p>Not connected</p>}
      {!isConnectedBf2Server && server.data && (
        <>
          <Link href={server.data.joinmeHref}>Join me</Link>
          <Link href={server.data.joinmeDirect}>Start bf2</Link>
        </>
      )}
      <SearchParamToggle param="auto" label="Auto join BF2 server" />
    </section>
  );
}
