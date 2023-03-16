import { commands, GatewayCommand } from './commands';

export const createHelpContent = () => {
  const usage = 'Usage: \n\n'.concat(commands.map(getUsage).join('\n'));

  const allCommands = 'All commands: \n\n'.concat(
    commands.map((cmd) => cmd.command).join(', ')
  );

  return 'Help: \n\n'.concat(usage).concat(allCommands);
};

const getUsage = (command: GatewayCommand) => {
  switch (command.name) {
    case 'help: ':
      return ['!help\tlist commands and how to use them'];
    case 'info: ':
      return ['!who\tdisplay active matches'];
    case 'join: ':
      return ['++\tjoin an open match'];
    case 'leave: ':
      return ['--\tleave current match'];
    case 'pick: ':
      return [`!pick <@player>\tas captain pick a player`];
    case 'expire: ':
      return ['!expire\tdisplay time until your queue expire'];
    default:
      return [];
  }
};
