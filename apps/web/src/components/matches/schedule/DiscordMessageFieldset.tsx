'use client';
import { useCallback, useState } from 'react';
import { getDiscordMessage } from '@/app/matches/schedule/actions';
import { formatDiscordMessageContentDateText, parseError } from '@bf2-matchmaking/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isDefined, MapsRow, ServersRow } from '@bf2-matchmaking/types';
import InputField from '@/components/form/fields/InputField';
import SelectField from '@/components/form/fields/SelectField';
import Fieldset from '@/components/form/Fieldset';
import { toast } from 'react-toastify';

interface Props {
  onParse?: (
    isoTime: string | null,
    serverNames: Array<string> | null,
    mapNames: Array<string> | null
  ) => void;
  setSearchParamsOnParse?: boolean;
  servers: Array<ServersRow>;
  maps: Array<MapsRow>;
}

export function DiscordMessageFieldset({
  onParse,
  setSearchParamsOnParse,
  servers,
  maps,
}: Props) {
  const [messageId, setMessageId] = useState('');
  const [channelId, setChannelId] = useState('1372680394427858944');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createNewUrl = useCallback(
    (entries: Record<string, string | Array<string> | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','));
        }
        if (typeof value === 'string') {
          params.set(key, value);
        }
      }
      return `${pathname}?${params.toString()}`;
    },
    [searchParams, pathname]
  );
  const toServerAdress = useCallback(
    (serverName: string) =>
      servers.find((server) =>
        server.name.toLowerCase().includes(serverName.toLowerCase())
      )?.ip,
    [servers]
  );
  const toMapId = useCallback(
    (mapName: string) =>
      maps
        .find((map) => map.name.toLowerCase().includes(mapName.toLowerCase()))
        ?.id.toString(),
    [maps]
  );

  const parseMessage = useCallback(async () => {
    const { data, error } = await getDiscordMessage(channelId, messageId);
    if (error) {
      toast.error(parseError(error));
      return;
    }
    if (!data) {
      toast.error('No message found');
      return;
    }

    const time = formatDiscordMessageContentDateText(data.content)?.toISO() || null;
    const extractedMaps = extractValues(data.content, 'Maps')
      .map(toMapId)
      .filter(isDefined);
    const extractedServers = extractValues(data.content, 'Server')
      .map(toServerAdress)
      .filter(isDefined);
    if (onParse) {
      onParse(time, extractedServers, extractedMaps);
    }
    if (setSearchParamsOnParse) {
      router.push(createNewUrl({ time, maps: extractedMaps, servers: extractedServers }));
    }
  }, [onParse, messageId, channelId, router, toMapId, toServerAdress, servers]);

  return (
    <Fieldset
      legend="Discord message"
      helpText="Enable Discord Developer Mode to copy Message ID"
    >
      <SelectField
        options={[
          ['1372680394427858944', '8v8-every-2-weeks'],
          ['1046889100369739786', 'ATS'],
        ]}
        placeholder="Select Channel"
        name="channelId"
        onChange={(e) => setChannelId(e.target.value)}
        value={channelId}
      />
      <InputField
        name="messageId"
        label="Message ID"
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-secondary w-min"
        disabled={!messageId}
        onClick={parseMessage}
      >
        Parse
      </button>
    </Fieldset>
  );
}

function extractValues(text: string, type: 'Server' | 'Maps'): Array<string> {
  const match = text.match(new RegExp(`${type}:\s*(.+)`, 'i'));
  if (!match) {
    return [];
  }
  return match[1].split(',').map((value) => value.trim());
}
