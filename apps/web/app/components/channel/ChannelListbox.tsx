import React, { FC } from 'react';
import { Listbox } from '@headlessui/react';

interface Props {
  channels: Array<string>;
}

const ChannelListbox: FC<Props> = ({ channels }) => {
  return (
    <Listbox defaultValue={{ name: 'No channel' }} name="channel">
      <Listbox.Label>Channel:</Listbox.Label>
      <Listbox.Button>{({ value }) => value.name}</Listbox.Button>
      <Listbox.Options>
        {channels.map((channel) => (
          <Listbox.Option key={channel} value={channel}>
            {channel}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};

export default ChannelListbox;
