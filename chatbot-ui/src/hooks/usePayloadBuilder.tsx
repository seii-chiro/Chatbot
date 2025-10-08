import type { MessagesHistory } from "@/lib/definitions";
import { useState } from "react";

type PayloadHistory = {
  model: "llama3.1:8b-instruct-q5_K_M";
  messages: MessagesHistory[];
};

const usePayloadBuilder = () => {
  const [payload, setPayload] = useState<PayloadHistory>({
    model: "llama3.1:8b-instruct-q5_K_M",
    messages: [],
  });

  function updatePayload(newPayload: MessagesHistory) {
    setPayload((prev) => ({
      ...prev,
      messages: [...prev.messages, newPayload],
    }));
  }

  return { payload, updatePayload };
};

export default usePayloadBuilder;
