import ChatLayout from "./chat/ChatLayout";
import { ThemeProvider } from "./components/ui/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-full h-full flex flex-col">
        <ChatLayout />
      </div>
    </ThemeProvider>
  );
}

export default App;
