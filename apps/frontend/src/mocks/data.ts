import type { Channel, Dm, Message, User, Workspace } from '@/types';

export const workspace: Workspace = {
  id: 'gather',
  name: 'Studio North',
  initials: 'N',
  description: 'Good people. Great ideas.',
};
export const users: User[] = [
  {
    id: 'u0',
    name: 'Alex Morgan',
    handle: 'alex',
    email: 'demo@slack.clone',
    avatar: 'https://i.pravatar.cc/100?img=12',
    presence: 'online',
  },
  {
    id: 'u1',
    name: 'Olivia Chen',
    handle: 'olivia',
    email: 'olivia@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=47',
    presence: 'online',
  },
  {
    id: 'u2',
    name: 'James Wilson',
    handle: 'james',
    email: 'james@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=13',
    presence: 'online',
  },
  {
    id: 'u3',
    name: 'Sofia Martinez',
    handle: 'sofia',
    email: 'sofia@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=44',
    presence: 'away',
  },
  {
    id: 'u4',
    name: 'Ethan Parker',
    handle: 'ethan',
    email: 'ethan@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=11',
    presence: 'online',
  },
  {
    id: 'u5',
    name: 'Mia Thompson',
    handle: 'mia',
    email: 'mia@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=49',
    presence: 'offline',
  },
  {
    id: 'u6',
    name: 'Noah Williams',
    handle: 'noah',
    email: 'noah@studionorth.co',
    avatar: 'https://i.pravatar.cc/100?img=14',
    presence: 'online',
  },
];
export const channels: Channel[] = [
  {
    id: 'general',
    name: 'general',
    topic: 'A little bit of everything. A whole lot of us. ✨',
    unreadCount: 4,
  },
  {
    id: 'design',
    name: 'design',
    topic: 'Ideas, inspiration, and pixels with purpose.',
    unreadCount: 2,
  },
  {
    id: 'frontend',
    name: 'frontend',
    topic: 'Building delightful things for the web.',
    unreadCount: 0,
  },
  { id: 'random', name: 'random', topic: 'The internet’s best rabbit holes.', unreadCount: 3 },
  {
    id: 'announcements',
    name: 'announcements',
    topic: 'The things everyone should know.',
    unreadCount: 0,
  },
  {
    id: 'product',
    name: 'product',
    topic: 'Turning the what-ifs into what’s next.',
    unreadCount: 0,
  },
  {
    id: 'inspiration',
    name: 'inspiration',
    topic: 'A collection of things that make us look twice.',
    unreadCount: 0,
  },
  {
    id: 'watercooler',
    name: 'watercooler',
    topic: 'Coffee breaks, weekend plans, and good company.',
    unreadCount: 0,
  },
];
export const dms: Dm[] = users
  .slice(1)
  .map((user, i) => ({ id: `dm-${user.id}`, user, unreadCount: i === 0 ? 2 : 0 }));
const generalCopy = [
  'Morning, team! Hope everyone had a lovely weekend ☀️',
  'Morning! A coffee and a clean Figma file. Starting the week right.',
  'Quick reminder: our weekly catch-up is at 10. Bring your ideas (and your coffee).',
  'Just pushed the latest updates to staging. The new onboarding is feeling really good!',
  'Had a look this morning — those little transitions are so satisfying 👏',
  'Does anyone have a recommendation for a good design podcast?',
  'Design Details is my go-to. Their latest episode is a great one.',
  'Adding that to my list, thank you!',
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
  'Just finished the landing page updates. Ready for a fresh pair of eyes when someone has a moment.',
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
const now = new Date();
now.setHours(10, 0, 0, 0);
export const messages: Message[] = [];
for (const channel of channels) {
  for (let i = 0; i < 30; i++) {
    const copy = channelCopy[channel.id] ?? generalCopy;
    const text = copy[i % copy.length] ?? 'Thanks for the update!';
    messages.push({
      id: `${channel.id}-${i}`,
      channelId: channel.id,
      userId: `u${(i + 1) % users.length}`,
      text,
      createdAt: new Date(now.getTime() - (i < 20 ? 86400000 : 0) + i * 4 * 60000).toISOString(),
      reactions: [8, 16, 20, 26, 27].includes(i)
        ? [
            { emoji: i === 26 ? '🚀' : '🙌', userIds: ['u1', 'u2', 'u4'] },
            { emoji: '💚', userIds: ['u3', 'u6'] },
          ]
        : [],
      replyCount: 0,
      edited: i === 24,
    });
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
  parent.replyCount = copy.length;
  copy.forEach((text, i) =>
    messages.push({
      id: `${parent.id}-reply-${i}`,
      ...(parent.channelId ? { channelId: parent.channelId } : {}),
      parentId: parent.id,
      userId: `u${i + 1}`,
      text,
      createdAt: new Date(new Date(parent.createdAt).getTime() + (i + 1) * 60000).toISOString(),
      reactions: [],
      replyCount: 0,
      edited: false,
    }),
  );
}
