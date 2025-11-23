import { Message } from "./message";

export type Thread = {
  id: string;
  participants: string[];
  messages: Message[];
  createdAt: Date;
};
