'use client';
import TextField from '@/components/commons/TextField';
import { useMemo, useState } from 'react';
import useSWR from 'swr/mutation';
import Select from '@/components/commons/Select';
import { getDiscordMessage } from '@/app/matches/schedule/actions';

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

    return data.content;
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
