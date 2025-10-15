import { ChatSidebar } from "../components/ChatSidebar";
import { ChatArea } from "../components/ChatArea";
import { useConversations } from "@/hooks/use-conversation";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getAllWindows, windows, userLogged } = useConversations();
  const navigate = useNavigate();

  if (!userLogged) {
    navigate("/login");
  }

  useEffect(() => {
    getAllWindows();
  }, []);

  const orderWindows = windows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        chats={orderWindows}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
