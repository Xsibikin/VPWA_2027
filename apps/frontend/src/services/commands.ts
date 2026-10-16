// Parser for the command line. It only turns text into a typed command;
// running the command is the job of composables/useChannelCommands.ts.
export type Command =
  | { name: 'join'; channel: string; isPrivate: boolean }
  | { name: 'invite' | 'revoke' | 'kick'; nick: string }
  | { name: 'quit' | 'cancel' | 'list' };

// Shown by the command line as suggestions while the user types "/".
export interface CommandInfo {
  name: Command['name'];
  args: string;
  description: string;
}
export const COMMANDS: CommandInfo[] = [
  {
    name: 'join',
    args: 'channelName [private]',
    description: 'Join a channel or create a new one',
  },
  { name: 'invite', args: 'nickName', description: 'Invite someone to this channel' },
  { name: 'revoke', args: 'nickName', description: 'Remove someone from a private channel' },
  { name: 'kick', args: 'nickName', description: 'Vote to kick a member (admin bans at once)' },
  { name: 'list', args: '', description: 'Show the members of this channel' },
  { name: 'cancel', args: '', description: 'Leave this channel' },
  { name: 'quit', args: '', description: 'Close this channel for everyone (admin)' },
];

export const isCommand = (text: string) => text.trimStart().startsWith('/');

export function parseCommand(input: string): Command {
  const [word = '', ...args] = input.trim().split(/\s+/);
  const name = word.slice(1).toLowerCase();
  switch (name) {
    case 'join': {
      const [channel, flag, ...rest] = args;
      if (!channel || rest.length || (flag !== undefined && flag.toLowerCase() !== 'private'))
        throw new Error('Usage: /join channelName [private]');
      return { name, channel: channel.replace(/^#/, ''), isPrivate: flag !== undefined };
    }
    case 'invite':
    case 'revoke':
    case 'kick': {
      const [nick, ...rest] = args;
      if (!nick || rest.length) throw new Error(`Usage: /${name} nickName`);
      return { name, nick: nick.replace(/^@/, '') };
    }
    case 'quit':
    case 'cancel':
    case 'list':
      if (args.length) throw new Error(`/${name} does not take any arguments.`);
      return { name };
    default:
      throw new Error(
        `Unknown command ${word}. Try /join, /invite, /revoke, /kick, /list, /cancel or /quit.`,
      );
  }
}
