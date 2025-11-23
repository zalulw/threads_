export type Message = {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  createdAt: string;
  parentMsgId?: number;
  isRead: number;
  senderUsername: string;
  recipientUsername: string;
};
