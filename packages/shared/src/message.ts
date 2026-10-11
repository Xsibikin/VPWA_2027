export type ContentType = 'text' | 'file' | 'img';

export interface Msg {
  id: number; // serial PK
  channelId: string; // uuid FK -> Channel
  senderId: string; // uuid FK -> User
  createdAt: string; // ISO timestamp
  contentType: ContentType;
  textContent: string;
  cdnLink?: string | null;
}

export interface MsgMention {
  id: string; // uuid
  mentionedId: string; // uuid FK -> User
  msgId: number; // FK -> Msg.id
}
