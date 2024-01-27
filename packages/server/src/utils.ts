import { MatchesJoined } from '@bf2-matchmaking/types';

export function createServerName(
  match: MatchesJoined,
  index: number,
  regions: Array<string>
) {
  const region =
    regions.length > 1 && regions[index] ? ` ${regions[index].toUpperCase()}` : '';
  return `${match.config.name} Match ${match.id}${region}`;
}

// https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
export function getServerMap(match: MatchesJoined, index: number) {
  const map = match.maps.length > index ? match.maps[index].name : match.maps.at(0)?.name;
  return map
    ? map.replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase())
    : 'strike_at_karkand';
}

export function getServerVehicles(match: MatchesJoined) {
  return match.config.vehicles ? 'true' : 'false';
}

export function createServerSubDomain(
  match: MatchesJoined,
  index: number,
  regions: Array<string>
) {
  const region = regions.length > 1 && regions[index] ? `-${regions[index]}` : '';
  return `m${match.id}${region}`;
}
