import { MatchesJoined, PlayersRow } from '@bf2-matchmaking/types';

export function generateMatchUsersXml(match: MatchesJoined) {
  return `<?xml version="1.0" standalone="yes"?>
<dsdUsers xmlns="http://bf2cc.com/dsdUsers.xsd">
  <Users>
    <Username>admin</Username>
    <Password>21232f297a57a5a743894a0e4a801fc3</Password>
    <IsEnabled>true</IsEnabled>
    <Notes>Administrator account</Notes>
    <GroupName>Administrators</GroupName>
  </Users>
${match.players.map(getUserElement).join('\n')}
${getGroupProperties()}
</dsdUsers>
`;
}

function getUserElement(player: PlayersRow) {
  if (!player.keyhash) {
    return '';
  }
  return `  <Users>
    <Username>${player.full_name}</Username>
    <Password>2023</Password>
    <IsEnabled>true</IsEnabled>
    <Notes>${player.full_name}</Notes>
    <GroupName>Administrators</GroupName>
  </Users>
  <UserProperties>
    <Username>${player.full_name}</Username>
    <PropName>Hash</PropName>
    <PropValue>${player.keyhash}</PropValue>
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
