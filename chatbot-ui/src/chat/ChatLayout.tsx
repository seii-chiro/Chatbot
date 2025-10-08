import { useState } from "react";
import ChatBody from "./ChatBody";
import ChatInput from "./ChatInput";
import ChatMessageArea from "./ChatMessageArea";
import type { Messages, MessagesHistory } from "@/lib/definitions";
import usePayloadBuilder from "@/hooks/usePayloadBuilder";

const ChatLayout = () => {
  const [messages, setMessages] = useState<Messages[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { payload, updatePayload } = usePayloadBuilder();

  const handleStreamingResponse = async (userMessage: string) => {
    // Add user message
    const userMsg = {
      id: Date.now(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Create placeholder for bot message
    const botMsgId = Date.now() + 1;
    const botMsg = {
      id: botMsgId,
      text: "",
      isUser: false,
      isStreaming: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);

    const userMsgForLLM: MessagesHistory = {
      role: "user",
      content: userMessage,
    };
    const nextPayload = {
      model: payload.model,
      messages: [...payload.messages, userMsgForLLM],
    };

    // 2️⃣ Update state (async, safe)
    updatePayload(userMsgForLLM);

    try {
      const response = await fetch("http://localhost:8005/rag/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextPayload),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log("RAW CHUNK:", chunk);

        // Parse SSE format if your endpoint uses it
        // Adjust this parsing based on your endpoint's format
        const lines = chunk.split(/\r?\n/);
        for (const raw of lines) {
          const line = raw.trim();
          if (line.length === 0) continue;
          console.log("PROCESSING LINE:", line);

          if (
            line.startsWith("event:") ||
            line.startsWith("id:") ||
            line.startsWith("retry:")
          ) {
            continue;
          }

          if (line.startsWith("data: ")) {
            const dataContent = line.slice(6);

            if (dataContent.trim().length === 0) {
              continue;
            }

            try {
              const data = JSON.parse(dataContent);

              if (
                typeof data === "string" ||
                typeof data === "number" ||
                typeof data === "boolean"
              ) {
                accumulatedText += String(data);
              } else {
                // It's an object, try to extract the content
                const textToAdd = data.token ?? data.content ?? data.text ?? "";
                accumulatedText += textToAdd;
              }
            } catch {
              // Not JSON, add as plain text
              accumulatedText += dataContent;
            }
          }
        }

        console.log("ACCUMULATED SO FAR:", accumulatedText);

        // Update the message with accumulated text
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
          )
        );
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      updatePayload({
        role: "assistant",
        content: accumulatedText,
      });
    } catch (error) {
      console.error("Error streaming response:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                text: "Error: Failed to get response",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <ChatBody>
      <div className="flex-grow h-full flex flex-col">
        <ChatMessageArea messages={messages} />
        <ChatInput
          onSendMessage={handleStreamingResponse}
          disabled={isStreaming}
        />
      </div>
    </ChatBody>
  );
};

export default ChatLayout;
