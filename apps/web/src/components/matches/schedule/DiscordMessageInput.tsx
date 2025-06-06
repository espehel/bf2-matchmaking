'use client';
import TextField from '@/components/commons/TextField';
import { useMemo, useState } from 'react';
import useSWR from 'swr/mutation';
import Select from '@/components/commons/Select';
import { getDiscordMessage } from '@/app/matches/schedule/actions';
import { formatDiscordMessageContentDateText } from '@bf2-matchmaking/utils';

export function DiscordMessageInput() {
  const [messageId, setMessageId] = useState('');
  const [channelId, setChannelId] = useState('1372680394427858944');

  const { data, trigger } = useSWR('discordMessage', () =>
    getDiscordMessage(channelId, messageId)
  );

  const parsedMessage = useMemo(() => {
    if (!data || !data.content) {
      return 'No message content found';
    }

    const time = formatDiscordMessageContentDateText(data.content);

    const mapsMatch = data.content.match(/Maps:\s*(.+)/);
    const maps = mapsMatch ? mapsMatch[1].trim() : null;

    const serversMatch = data.content.match(/Servers:\s*(.+)/);
    const servers = serversMatch ? serversMatch[1].trim() : null;

    return `Time: ${time || 'N/A'}\nMaps: ${maps || 'N/A'}\nServers: ${servers || 'N/A'}`;
  }, [data]);

  return (
    <div>
      <Select
        options={[
          ['1372680394427858944', '8v8-every-2-weeks'],
          ['1046889100369739786', 'ATS'],
        ]}
        label="Channel"
        name="channelId"
        onChange={(e) => setChannelId(e.target.value)}
        value={channelId}
      />
      <TextField
        name="message"
        label="Discord message"
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!messageId}
        onClick={() => trigger()}
      >
        Parse
      </button>
      <p className="text-sm">{parsedMessage}</p>
    </div>
  );
}
