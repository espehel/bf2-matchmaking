import React, { FC } from 'react';
import { DiscordChannelsWithMatches, DiscordChannelsRow } from '@bf2-matchmaking/types';
import { Listbox } from '@headlessui/react';

interface Props {
  channels: Array<DiscordChannelsWithMatches>;
}

const ChannelListbox: FC<Props> = ({ channels }) => {
  return (
    <Listbox defaultValue={{ name: 'No channel' }} name="channel">
      <Listbox.Label>Channel:</Listbox.Label>
      <Listbox.Button>{({ value }) => value.name}</Listbox.Button>
      <Listbox.Options>
        {channels.map((channel) => (
          <Listbox.Option key={channel.id} value={channel}>
            {channel.name}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};

export default ChannelListbox;
