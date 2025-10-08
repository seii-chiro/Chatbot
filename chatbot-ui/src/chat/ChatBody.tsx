import React from "react";

const ChatBody = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="bg-chat-box-background p-2 rounded-sm h-full md:h-[90%] w-full md:w-[80%] lg:w-[70%] xl:w-[50%] transition-all ease-in-out">
        {children}
      </div>
    </div>
  );
};

export default ChatBody;
