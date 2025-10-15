import { useNavigate, useParams } from "react-router-dom";
import { ChatSidebar } from "../components/ChatSidebar";
import { ChatArea } from "../components/ChatArea";
import { useConversations } from "@/hooks/use-conversation";
import { useEffect, useState } from "react";

export function ChatPage() {
  const { chatId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    conversations,
    fetchConversationByWindowId,
    getAllWindows,
    windows,
    userLogged,
  } = useConversations();
  const navigate = useNavigate();

  if (userLogged === null) {
    navigate("/login");
  }

  useEffect(() => {
    if (chatId) {
      fetchConversationByWindowId(chatId);
    }
  }, [chatId]);

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
        currentChatId={chatId}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          chatId={chatId}
          messages={conversations}
          onMenuClick={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
