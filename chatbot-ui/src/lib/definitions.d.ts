export type ChatRole = "user" | "assistant" | "system";

export interface Messages {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

export type MessagesHistory = {
  role: "user" | "assistant";
  content: string;
};
