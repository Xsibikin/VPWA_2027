import { parseCommand } from '@/services/commands';
import { useChatStore } from '@/stores/chat';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Channel } from '@/types';

// What the page has to provide so that a command can change what is on screen.
export interface CommandUi {
  open: (channel: Channel) => Promise<void>;
  // Called when the open channel is gone (left or closed).
  openFirst: () => Promise<void>;
  showMembers: () => void;
}

const VOTES_TO_BAN = 3;

// Runs the commands typed into the command line. `leave` and `close` are exported too,
// because the channel menu in the sidebar does the same thing as /cancel and /quit.
export function useChannelCommands(ui: CommandUi) {
  const workspace = useWorkspaceStore();
  const chat = useChatStore();

  function openChannel(): Channel {
    const channel =
      chat.kind === 'channel' ? workspace.channels.find((c) => c.id === chat.activeId) : undefined;
    if (!channel) throw new Error('This command only works inside a channel.');
    return channel;
  }

  async function leave(channel: Channel) {
    const { deleted } = await workspace.leave(channel.id);
    if (chat.activeId === channel.id) await ui.openFirst();
    return deleted
      ? `You left #${channel.name}. You were its admin, so the channel is closed.`
      : `You left #${channel.name}.`;
  }

  async function close(channel: Channel) {
    await workspace.close(channel.id);
    if (chat.activeId === channel.id) await ui.openFirst();
    return `#${channel.name} is closed.`;
  }

  // Returns the text to show the user; an empty string means there is nothing to announce.
  async function run(input: string): Promise<string> {
    const command = parseCommand(input);
    switch (command.name) {
      case 'join': {
        const { channel, created } = await workspace.join(command.channel, command.isPrivate);
        await ui.open(channel);
        return created
          ? `#${channel.name} is ready. You are its admin.`
          : `Welcome to #${channel.name}.`;
      }
      case 'invite': {
        openChannel();
        const user = await chat.invite(command.nick);
        return `Invitation sent to @${user.nick}.`;
      }
      case 'revoke': {
        const channel = openChannel();
        const user = await chat.revoke(command.nick);
        return `@${user.nick} no longer has access to #${channel.name}.`;
      }
      case 'kick': {
        const channel = openChannel();
        const { banned, votes } = await chat.kick(command.nick);
        return banned
          ? `@${command.nick} is banned from #${channel.name}.`
          : `Your vote to kick @${command.nick} is in (${votes} of ${VOTES_TO_BAN}).`;
      }
      case 'quit':
        return close(openChannel());
      case 'cancel':
        return leave(openChannel());
      case 'list':
        openChannel();
        ui.showMembers();
        return '';
    }
  }

  return { run, leave, close };
}
