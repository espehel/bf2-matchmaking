import { MatchesJoined, PlayersRow } from '@bf2-matchmaking/types';
import { info } from '@bf2-matchmaking/logging';
import { assertString, isUniqueTupleValue } from '@bf2-matchmaking/utils';
import { createHash } from 'node:crypto';

assertString(process.env.BF2CC_PASSWORD, 'BF2CC_PASSWORD is undefined');
const hashedPassword = createHash('md5')
  .update(process.env.BF2CC_PASSWORD)
  .digest('hex')
  .toUpperCase();

assertString(process.env.BF2CC_TEMP_PASSWORD, 'BF2CC_TEMP_PASSWORD is undefined');
const hashedTempPassword = createHash('md5')
  .update(process.env.BF2CC_TEMP_PASSWORD)
  .digest('hex')
  .toUpperCase();

export function generateMatchUsersXml(match: MatchesJoined) {
  info(
    'generateMatchUsersXml',
    `Generating users.xml for match ${match.id} with ${match.players.length} players.`
  );
  const players = match.players
    .concat(match.home_team.players.map(({ player }) => player))
    .concat(match.away_team.players.map(({ player }) => player));
  return generateUsersXml(players, hashedTempPassword);
}

export function generateUsersXml(players: Array<PlayersRow>, password?: string) {
  const uniquePlayers = players
    .filter((p) => p.keyhash !== null && p.keyhash.length > 1)
    .map<[string, string]>((p) => [p.nick, p.keyhash!])
    .filter(isUniqueTupleValue);

  return `<?xml version="1.0" standalone="yes"?>
<dsdUsers xmlns="http://bf2cc.com/dsdUsers.xsd">
  <Users>
    <Username>admin</Username>
    <Password>${password || hashedPassword}</Password>
    <IsEnabled>true</IsEnabled>
    <Notes>Administrator account</Notes>
    <GroupName>Administrators</GroupName>
  </Users>
${uniquePlayers.map(getUserElement(password || hashedPassword)).join('\n')}
${getGroupProperties()}
</dsdUsers>
`;
}

function getUserElement(password: string) {
  return ([nick, keyhash]: [string, string]) =>
    `  <Users>
    <Username>${nick}</Username>
    <Password>${password}</Password>
    <IsEnabled>true</IsEnabled>
    <Notes>${nick}</Notes>
    <GroupName>Administrators</GroupName>
  </Users>
  <UserProperties>
    <Username>${nick}</Username>
    <PropName>Hash</PropName>
    <PropValue>${keyhash}</PropValue>
  </UserProperties>`;
}

function getGroupProperties() {
  return `  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_Administrator</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_CreateProfiles</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditProfiles</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditBF2Settings</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditMapList</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditVOIPSettings</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditScoreSettings</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditAutoAdminSettings</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_EditAutoMessages</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_LoadProfiles</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_ShutdownServer</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_RestartServer</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_Ban</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>p_MaxBanTime</PropName>
    <PropValue>0</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_ManageBanList</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_Kick</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_ChangeMap</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_CustomCommands</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <GroupProperties>
    <GroupName>Administrators</GroupName>
    <PropName>r_DaemonOptions</PropName>
    <PropValue>1</PropValue>
  </GroupProperties>
  <Groups>
    <GroupName>Administrators</GroupName>
  </Groups>`;
}
