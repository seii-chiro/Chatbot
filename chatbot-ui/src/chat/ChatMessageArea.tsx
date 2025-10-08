import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import type { Messages } from "@/lib/definitions";
import { ModeToggle } from "@/components/ui/mode-toggle";

type Props = {
  messages: Messages[] | null;
};

const ChatMessageArea = ({ messages }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-grow w-full h-full flex flex-col px-2 py-2 overflow-hidden">
      <div className="flex justify-between items-center pb-1">
        <h1 className="font-bold">Chat</h1>
        <ModeToggle />
      </div>
      <div className="w-full h-full overflow-y-auto">
        <div className="flex flex-col h-full">
          {messages && messages.length > 0 ? (
            messages.map((msg, index) => (
              <ChatBubble
                key={index}
                message={msg.text}
                isUser={msg.isUser}
                isStreaming={msg.isStreaming || false}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No messages yet. Start a conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatMessageArea;
