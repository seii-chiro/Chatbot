type Props = {
  message: string;
  isUser: boolean;
  isStreaming: boolean;
};

const ChatBubble = ({ message, isUser, isStreaming }: Props) => {
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
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1">
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
