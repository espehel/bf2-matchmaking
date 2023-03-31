import { commands, GatewayCommand } from './commands';
import moment, { Duration } from 'moment';

export const createHelpContent = () => {
  const usage = 'Usage: \n\n'.concat(commands.map(getUsage).flat().join('\n'));

  const allCommands = 'All commands: \n\n'.concat(
    commands.map((cmd) => cmd.command).join(', ')
  );

  return 'Help: \n\n'.concat(usage).concat(allCommands);
};

const getUsage = (command: GatewayCommand) => {
  switch (command.name) {
    case 'help':
      return ['!help\tlist commands and how to use them'];
    case 'info':
      return ['!who\tdisplay active matches'];
    case 'join':
      return ['++\tjoin an open match'];
    case 'leave':
      return ['--\tleave current match'];
    case 'pick':
      return [`!pick <@player>\tas captain pick a player`];
    case 'expire':
      return [
        '!expire\tdisplay time until your queue expire',
        '!expire <duration>\t set duration until queue expire in m(minutes) or h(hours)',
      ];
    case 'capfor':
      return [
        "!capfor <@player>\t assign yourself as captain for mentioned captain's team",
      ];
    default:
      return [];
  }
};
interface Success {
  error: null;
  duration: Duration;
}

interface Error {
  error: string;
  duration: null;
}
export const parseDurationArg = (arg: string): Success | Error => {
  const unit = arg.slice(-1);
  const duration = parseInt(arg.slice(0, -1));
  if (!duration) {
    return { error: 'Invalid expire duration.', duration: null };
  }
  if (unit === 'm' || unit === 'h') {
    return { duration: moment.duration(duration, unit), error: null };
  }
  return { error: 'Invalid duration unit.', duration: null };
};
