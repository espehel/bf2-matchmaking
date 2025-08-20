import { logMessage } from '@bf2-matchmaking/logging/logtail';
import { LogContext } from '@bf2-matchmaking/types';

interface MessageLike {
  channel_id?: string;
  channel?: { name?: string };
  content?: string | null;
  embeds?: {
    title?: string | null;
    description?: string | null;
    fields?: { name?: string | null; value?: string | null }[];
  }[];
}
export const logChannelMessage = (message: MessageLike, context?: LogContext) => {
  const channel = message.channel?.name || message.channel_id || 'unknown';
  const text = getMessageText(message);
  logMessage(`<${channel}> ${text}`, context);
};
function getMessageText(message: MessageLike) {
  if (message.content) {
    return message.content;
  }
  const embed = message.embeds?.at(0);
  if (embed?.title) {
    return embed.title;
  }
  if (embed?.description) {
    return embed.description;
  }
  if (embed?.fields && embed.fields.length > 0) {
    return embed.fields.map((f) => `${f.name}: ${f.value}`).join(', ');
  }
  return 'No message content';
}
