import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConversationsProvider } from "./hooks/use-conversation.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConversationsProvider>
      <App />
    </ConversationsProvider>
  </StrictMode>
);
