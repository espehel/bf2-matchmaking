import { DiscordMatch } from '@bf2-matchmaking/types';
import { sendDirectMessage } from '@bf2-matchmaking/discord';

export const sendSummoningDM = (match: DiscordMatch) => {
  const content =
    `Check in has started for Match ${match.id}, you can check in at following places:`
      .concat(`\n  - Web: https://bf2-matchmaking.netlify.app/matches/${match.id}`)
      .concat(`\n  - React to discord message: <#${match.config.channel}>`);
  // TODO: Create staging channel for each match
  /*.concat(
        match.config.channel
          ? `\n  - Join staging voice channel: <#${match.config.channel}>.`
          : ''
      );*/
  return Promise.allSettled(
    match.players.map((player) => sendDirectMessage(player.id, { content }))
  );
};
