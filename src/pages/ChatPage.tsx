import { useNavigate, useParams } from "react-router-dom";
import { ChatSidebar } from "../components/ChatSidebar";
import { ChatArea } from "../components/ChatArea";
import { useConversations } from "@/hooks/use-conversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

export function ChatPage() {
  const { chatId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const {
    conversations,
    fetchConversationByWindowId,
    getAllWindows,
    windows,
    userLogged,
    loadingAiResponse,
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

  // Fechar sidebar automaticamente no mobile quando estiver carregando
  useEffect(() => {
    if (isMobile && loadingAiResponse && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile, loadingAiResponse, sidebarOpen]);

  const orderWindows = windows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <>
      <div
        className={`flex ${
          isMobile ? "h-screen" : "h-screen"
        } bg-gray-50 relative`}
      >
        <ChatSidebar
          chats={orderWindows}
          currentChatId={chatId}
          isOpen={sidebarOpen}
          onOpenChange={setSidebarOpen}
          isModalOpen={isModalOpen}
          onModalOpenChange={setIsModalOpen}
        />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <ChatArea
            chatId={chatId}
            messages={conversations}
            onMenuClick={() => setSidebarOpen(true)}
            onNewChatClick={() => {
              setIsModalOpen(true);
              if (isMobile) {
                setSidebarOpen(true);
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
