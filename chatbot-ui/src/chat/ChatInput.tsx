import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = {
  disabled: boolean;
  onSendMessage: (message: string) => Promise<void>;
};

const ChatInput = ({ disabled, onSendMessage }: Props) => {
  const [question, setQuestion] = useState("");

  const handleSend = () => {
    if (question.trim().length > 0) {
      onSendMessage(question);
      setQuestion("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={question}
        disabled={disabled}
        placeholder="Type your message here."
        onChange={(e) => setQuestion(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <Button
        disabled={question.trim().length === 0 || disabled}
        onClick={handleSend}
      >
        Send
      </Button>
    </div>
  );
};

export default ChatInput;
