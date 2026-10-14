import type { Invite, UserChannel, VoteKick, VoteKickVoter } from '@vpwa/shared';
import type { Channel, ChannelType, Dm, Message, User, Workspace } from '@/types';

// unreadCount is per user, so it is kept in `unread` below instead of on the row.
export type ChannelRow = Omit<Channel, 'unreadCount'>;

const DAY = 86400000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export const workspace: Workspace = {
  id: 'gather',
  name: 'Studio North',
  initials: 'N',
  description: 'Good people. Great ideas.',
};
export const users: User[] = [
  {
    id: 'u0',
    name: 'Alex',
    lastName: 'Morgan',
    nick: 'alex',
    email: 'demo@slack.clone',
    avatar: 'https://i.pravatar.cc/100?img=12',
    state: 'Online',
    mentionOnlyNotif: false,
  },
  {
    id: 'u1',
    name: 'Olivia',
    lastName: 'Chen',
    nick: 'olivia',
    email: 'olivia@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=47',
    state: 'Online',
    mentionOnlyNotif: false,
  },
  {
    id: 'u2',
    name: 'James',
    lastName: 'Wilson',
    nick: 'james',
    email: 'james@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=13',
    state: 'Online',
    mentionOnlyNotif: false,
  },
  {
    id: 'u3',
    name: 'Sofia',
    lastName: 'Martinez',
    nick: 'sofia',
    email: 'sofia@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=44',
    state: 'DND',
    mentionOnlyNotif: false,
  },
  {
    id: 'u4',
    name: 'Ethan',
    lastName: 'Parker',
    nick: 'ethan',
    email: 'ethan@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=11',
    state: 'Online',
    mentionOnlyNotif: false,
  },
  {
    id: 'u5',
    name: 'Mia',
    lastName: 'Thompson',
    nick: 'mia',
    email: 'mia@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=49',
    state: 'Offline',
    mentionOnlyNotif: false,
  },
  {
    id: 'u6',
    name: 'Noah',
    lastName: 'Williams',
    nick: 'noah',
    email: 'noah@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=14',
    state: 'Online',
    mentionOnlyNotif: false,
  },
];
// Seed users share the demo password; users registered in the UI are added to `users` later.
export const seedUserIds = new Set(users.map((user) => user.id));

// A channel nobody wrote in for more than 30 days; the mock API removes it on first load.
const STALE_CHANNEL = 'launch-2025';

const row = (id: string, owner: string, type: ChannelType, topic: string): ChannelRow => ({
  id,
  name: id,
  owner,
  type,
  topic,
  createdAt: daysAgo(90),
  lastActivity: daysAgo(90),
});
export const channels: ChannelRow[] = [
  row('general', 'u1', 'public', 'A little bit of everything. A whole lot of us. ✨'),
  row('design', 'u3', 'public', 'Ideas, inspiration, and pixels with purpose.'),
  row('frontend', 'u0', 'public', 'Building delightful things for the web.'),
  row('random', 'u2', 'public', 'The internet’s best rabbit holes.'),
  row('announcements', 'u1', 'private', 'The things everyone should know.'),
  row('product', 'u0', 'private', 'Turning the what-ifs into what’s next.'),
  row('inspiration', 'u4', 'public', 'A collection of things that make us look twice.'),
  row('watercooler', 'u6', 'public', 'Coffee breaks, weekend plans, and good company.'),
  // The demo user is not a member of the channels below.
  row('book-club', 'u5', 'public', 'One chapter at a time.'),
  row('leadership', 'u1', 'private', 'Planning and priorities.'),
  row('gaming', 'u2', 'public', 'Friday night lobbies.'),
  row('offsite', 'u1', 'private', 'Planning the autumn team offsite.'),
  row('music', 'u2', 'public', 'What’s in your headphones today?'),
  row(STALE_CHANNEL, 'u3', 'public', 'Last year’s launch war room.'),
];
const memberIds: Record<string, string[]> = {
  general: ['u0', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
  design: ['u0', 'u1', 'u3', 'u4', 'u5'],
  frontend: ['u0', 'u2', 'u4', 'u6'],
  random: ['u0', 'u1', 'u2', 'u3', 'u4', 'u6'],
  announcements: ['u0', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
  product: ['u0', 'u1', 'u3'],
  inspiration: ['u0', 'u3', 'u4', 'u5'],
  watercooler: ['u0', 'u1', 'u2', 'u5', 'u6'],
  'book-club': ['u5', 'u1', 'u3'],
  leadership: ['u1', 'u2'],
  gaming: ['u2', 'u4', 'u6'],
  offsite: ['u1', 'u3', 'u4'],
  music: ['u2', 'u4', 'u5'],
  [STALE_CHANNEL]: ['u0', 'u3', 'u5'],
};
export const memberships: UserChannel[] = [
  ...Object.entries(memberIds).flatMap(([channelId, ids]) =>
    ids.map((userId) => ({ id: `${channelId}:${userId}`, channelId, userId, banned: false })),
  ),
  // The demo user was kicked out of #gaming for good, so `/join gaming` is refused.
  { id: 'gaming:u0', channelId: 'gaming', userId: 'u0', banned: true },
];
export const invites: Invite[] = [
  {
    id: 'invite-offsite',
    inviterId: 'u1',
    inviteeId: 'u0',
    channelId: 'offsite',
    createdAt: daysAgo(0),
    status: 'pending',
  },
  {
    id: 'invite-music',
    inviterId: 'u4',
    inviteeId: 'u0',
    channelId: 'music',
    createdAt: daysAgo(1),
    status: 'pending',
  },
];
// Two members already voted to kick @noah from #random; a third vote bans him.
export const voteKicks: VoteKick[] = [
  { id: 'vote-random-u6', channelId: 'random', targetId: 'u6', createdAt: daysAgo(0) },
];
export const voteKickVoters: VoteKickVoter[] = [
  { id: 'vote-random-u6:u3', voteKickId: 'vote-random-u6', userId: 'u3' },
  { id: 'vote-random-u6:u4', voteKickId: 'vote-random-u6', userId: 'u4' },
];
// Unread counters keyed by `${userId}/${channelId or dmId}`.
export const unread: Record<string, number> = {
  'u0/general': 4,
  'u0/design': 2,
  'u0/random': 3,
  'u0/dm-u1': 2,
};
export const dms: Dm[] = users
  .slice(1)
  .map((user, i) => ({ id: `dm-${user.id}`, user, unreadCount: i === 0 ? 2 : 0 }));

export const MENTION_PATTERN = /@([\w-]+)/g;
export function findMentions(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const nick = match[1]?.toLowerCase();
    const user = users.find((user) => user.nick.toLowerCase() === nick);
    if (user) ids.add(user.id);
  }
  return [...ids];
}

const generalCopy = [
  'Morning, team! Hope everyone had a lovely weekend ☀️',
  'Morning! A coffee and a clean Figma file. Starting the week right.',
  'Quick reminder: our weekly catch-up is at 10. Bring your ideas (and your coffee).',
  'Just pushed the latest updates to staging. The new onboarding is feeling really good!',
  'Had a look this morning — those little transitions are so satisfying 👏',
  'Does anyone have a recommendation for a good design podcast?',
  'Design Details is my go-to. Their latest episode is a great one.',
  'Adding that to my list, thank you @james!',
  'A small win: we crossed 2,000 sign-ups over the weekend! 🎉',
  'That’s amazing. Love seeing all our hard work out in the world.',
  'The customer feedback has been so thoughtful, too. Sharing a few highlights at stand-up.',
  'I’ve updated the project notes with our next milestones.',
  'Thanks! Going through them after lunch.',
  'Anyone up for a little afternoon coffee walk? ☕',
  'Count me in. Could definitely use some fresh air.',
  'Sharing a little inspiration for the week: make things people love, with people you love working with.',
  'This team makes that pretty easy 💛',
  'A heads-up: I’ll be heads-down on the component library this afternoon.',
  'No worries. I’ll collect any feedback in the design channel.',
  'The new color palette is looking beautiful. That warm green is a keeper.',
  'Hey everyone! Our refreshed brand guidelines are ready for a first look. Would love your thoughts before we wrap them up 👀',
  'Oh, these are so good. The typography feels much more us.',
  'Agreed! The attention to detail on the icon set is incredible.',
  'Thanks team! A lot of little iterations went into this one.',
  'Just finished the landing page updates. @alex could you take a look when you have a moment?',
  'I can take a look! Dropping my notes in a thread shortly.',
  'Little Friday energy on a Wednesday. We just shipped the new dashboard! 🚀\nBig thanks to everyone who helped make it happen.',
  'Let’s gooo! So proud of this team 🙌',
  'It feels so much faster. The new navigation is a huge improvement.',
  'Couldn’t have done it without all of you. On to the next good thing ✨',
];
const channelCopy: Record<string, string[]> = {
  design: [
    'Sharing the first exploration of our new dashboard. Think softer surfaces, clearer hierarchy, and a little more breathing room.',
    'Love this direction. Could we explore a more compact navigation?',
    'Absolutely — I’ll add a variation to the board.',
    'The warm neutrals make the green accent really sing 🌿',
    'Updated the component library with the new button and card styles. Ready for feedback!',
    'The focus states look great. Accessibility review is looking good.',
  ],
  frontend: [
    'The latest build is ready on staging. Vue components are all typed now.',
    'Nice! The bundle size dropped by 12% after that refactor.',
    'I’ll review the PR after stand-up.',
    'Keyboard navigation and reduced-motion support are in.',
    'The responsive layout looks good on my phone too 👌',
    'Thanks for checking! Going to merge once the checks pass.',
  ],
  random: [
    'Important question: is a hot dog a sandwich?',
    'I came here for a coffee break, not an existential crisis 😂',
    'Sharing my weekend hike. Highly recommend getting out into the woods 🌲',
    'That sounds perfect. Adding it to my weekend list.',
    'Today’s playlist: mellow beats and absolutely no meetings.',
    'The office plant has a new leaf. This is not a drill 🪴',
  ],
};
// Seeded history ends a few minutes ago, so messages sent during the session always come after it.
const now = new Date(Date.now() - 2 * 3600000);
// The newest RECENT messages keep the ids `${channel}-${0..29}` that threads and reactions refer to;
// everything older is history that the infinite scroll loads page by page.
const RECENT = 30;
export const messages: Message[] = [];
for (const channel of channels) {
  const members = memberIds[channel.id] ?? [];
  if (channel.id === STALE_CHANNEL) {
    channel.createdAt = daysAgo(200);
    channel.lastActivity = daysAgo(45);
    messages.push({
      id: `${channel.id}-0`,
      channelId: channel.id,
      userId: channel.owner,
      text: 'That’s a wrap. Thank you all for an incredible launch!',
      createdAt: channel.lastActivity,
      mentions: [],
      reactions: [],
      replyCount: 0,
      edited: false,
    });
    continue;
  }
  const total = channel.id === 'general' ? 320 : 60;
  const copy = channelCopy[channel.id] ?? generalCopy;
  for (let n = 0; n < total; n++) {
    const i = n - (total - RECENT);
    const recent = i >= 0;
    const turn = recent ? i : n;
    const text = copy[turn % copy.length] ?? 'Thanks for the update!';
    const createdAt = new Date(
      recent
        ? now.getTime() - (i < 20 ? DAY : 0) + i * 4 * 60000
        : now.getTime() - DAY + i * 53 * 60000,
    ).toISOString();
    messages.push({
      id: recent ? `${channel.id}-${i}` : `${channel.id}-h${n}`,
      channelId: channel.id,
      userId: members[(turn + 1) % members.length] ?? channel.owner,
      text,
      createdAt,
      mentions: findMentions(text),
      reactions: [8, 16, 20, 26, 27].includes(i)
        ? [
            { emoji: i === 26 ? '🚀' : '🙌', userIds: ['u1', 'u2', 'u4'] },
            { emoji: '💚', userIds: ['u3', 'u6'] },
          ]
        : [],
      replyCount: 0,
      edited: i === 24,
    });
    channel.lastActivity = createdAt;
  }
}
for (const dm of dms) {
  const copy = [
    `Hey Alex! Got a minute to look at something together?`,
    'Of course! What are you working on?',
    'Just polishing the latest exploration. I think you’ll like this direction.',
    'That sounds great. Send it over when you’re ready!',
    'Appreciate you taking a look. Your feedback always helps.',
    'Happy to help! Let’s catch up after the team meeting ☕',
  ];
  for (let i = 0; i < 30; i++)
    messages.push({
      id: `${dm.id}-${i}`,
      dmId: dm.id,
      userId: i % 2 ? 'u0' : dm.user.id,
      text: copy[i % copy.length] ?? 'Thanks!',
      createdAt: new Date(now.getTime() - (i < 20 ? 86400000 : 0) + i * 5 * 60000).toISOString(),
      mentions: [],
      reactions: i === 26 ? [{ emoji: '👍', userIds: ['u0'] }] : [],
      replyCount: 0,
      edited: false,
    });
}
for (const parent of messages.filter(
  (m) =>
    !m.parentId &&
    ['general-20', 'general-24', 'general-26', 'design-20', 'frontend-26'].includes(m.id),
)) {
  const copy = [
    'This is looking really good! Love where we landed.',
    'Agreed. The little details make such a difference.',
    'One thought: could we give the header a little more space?',
    'Great call. I’ve added that to the next iteration.',
    'Thanks for the thoughtful feedback, everyone! 💚',
  ];
  const members = memberIds[parent.channelId ?? ''] ?? [];
  parent.replyCount = copy.length;
  copy.forEach((text, i) =>
    messages.push({
      id: `${parent.id}-reply-${i}`,
      ...(parent.channelId ? { channelId: parent.channelId } : {}),
      parentId: parent.id,
      userId: members[(i + 1) % members.length] ?? `u${i + 1}`,
      text,
      createdAt: new Date(new Date(parent.createdAt).getTime() + (i + 1) * 60000).toISOString(),
      mentions: [],
      reactions: [],
      replyCount: 0,
      edited: false,
    }),
  );
}
