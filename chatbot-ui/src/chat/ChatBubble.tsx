type Props = {
  message: string;
  isUser: boolean;
  isStreaming: boolean;
};

const thinkingPhrases = [
  "Processing...",
  "Working on it...",
  "Just a moment...",
  "One sec...",
  "Getting things ready...",
  "Hold tight...",
  "Analyzing your question...",
  "Cooking up a reply...",
  "Hmm... interesting...",
  "Let me think...",
];

const ChatBubble = ({ message, isUser, isStreaming }: Props) => {
  const loadingMessage =
    thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];

  return (
    <div
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`rounded-2xl py-2 px-4 max-w-[80%] break-words ${
          isUser ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-900"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        {isStreaming && !message.trim() && (
          <span className="w-1 h-4 animate-pulse ml-1 opacity-70">{loadingMessage}</span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
