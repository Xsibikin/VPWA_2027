export interface VoteKick {
  id: string; // uuid
  channelId: string; // uuid FK -> Channel
  targetId: string; // uuid FK -> User
  createdAt: string; // ISO timestamp
}

export interface VoteKickVoter {
  id: string; // uuid
  voteKickId: string; // uuid FK -> VoteKick
  userId: string; // uuid FK -> User
}
