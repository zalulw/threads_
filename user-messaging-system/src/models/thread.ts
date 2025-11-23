export interface Thread {
  id: string;
  participants: string[]; //user id-k tömbje
  messages: string[]; //üzenet id-k tömbje
  createdAt: Date;
  updatedAt: Date;
}
