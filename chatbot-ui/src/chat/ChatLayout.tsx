import { useState } from "react";
import ChatBody from "./ChatBody";
import ChatInput from "./ChatInput";
import ChatMessageArea from "./ChatMessageArea";
import type { Messages, MessagesHistory } from "@/lib/definitions";
import usePayloadBuilder from "@/hooks/usePayloadBuilder";
import { ModeToggle } from "@/components/ui/mode-toggle";

const ChatLayout = () => {
  const [messages, setMessages] = useState<Messages[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { payload, updatePayload } = usePayloadBuilder();
  const [sources, setSources] = useState("");

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

    // Update state
    updatePayload(userMsgForLLM);

    try {
      const response = await fetch("/rag/stream", {
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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split by newlines (NDJSON format)
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        // Process each complete line
        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);
            console.log("PARSED CHUNK:", chunk);

            switch (chunk.type) {
              case "content":
                // Accumulate content chunks
                accumulatedText += chunk.content;

                // Update the message with accumulated text
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId
                      ? { ...msg, text: accumulatedText }
                      : msg
                  )
                );
                break;

              case "sources":
                // Handle sources
                console.log("SOURCES:", chunk.sources);
                setSources(JSON.stringify(chunk.sources, null, 2));
                break;

              case "error":
                // Handle error
                console.error("Stream error:", chunk.message);
                throw new Error(chunk.message);

              case "done":
                // Stream complete
                console.log("Stream complete");
                break;

              default:
                console.warn("Unknown chunk type:", chunk.type);
            }
          } catch (parseError) {
            console.error("Failed to parse JSON line:", line, parseError);
          }
        }
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
        <header className="w-full bg-sidebar-ring flex justify-between items-center p-2">
          <h1 className="font-bold">Laggy Chatbot</h1>
          <ModeToggle />
        </header>
        <main className="w-full h-full px-2 pb-3 gap-2 flex flex-col overflow-hidden">
          <ChatMessageArea messages={messages} sources={sources} />
          <ChatInput
            onSendMessage={handleStreamingResponse}
            disabled={isStreaming}
          />
        </main>
      </div>
    </ChatBody>
  );
};

export default ChatLayout;
