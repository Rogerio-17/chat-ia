import { useNavigate, useParams } from "react-router-dom";
import { ChatSidebar } from "../components/ChatSidebar";
import { ChatArea } from "../components/ChatArea";
import { useConversations } from "@/hooks/use-conversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

export function ChatPage() {
  const { chatId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <ChatArea
            chatId={chatId}
            messages={conversations}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>
      </div>

      {/* Loading overlay que cobre TUDO - sempre por último para ficar por cima */}
      {loadingAiResponse && (
        <div
          className="fixed inset-0 bg-white flex items-center justify-center"
          style={{
            zIndex: 999999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
          }}
        >
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">IA está respondendo...</p>
          </div>
        </div>
      )}
    </>
  );
}
