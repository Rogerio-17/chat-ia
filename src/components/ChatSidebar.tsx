import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Sheet, SheetContent } from "./ui/sheet";
import { CgLogOut } from "react-icons/cg";
import { MdDelete } from "react-icons/md";

import { useConversations } from "@/hooks/use-conversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/utils/format-date";
import type { Window } from "@/server/firebase-services";
import { auth } from "@/server/firebase-client";

interface ChatSidebarProps {
  chats: Window[];
  currentChatId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatSidebar({
  chats,
  currentChatId,
  isOpen,
  onOpenChange,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const { createWindow, userLogged, deleteWindow } = useConversations();

  const handleCreateConversation = async () => {
    if (conversationTitle.trim()) {
      const { windowId } = await createWindow(conversationTitle);
      navigate(`/chat/${windowId}`);
      setIsModalOpen(false);
      setConversationTitle("");
      if (isMobile && onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  const handleCancelConversation = () => {
    setIsModalOpen(false);
    setConversationTitle("");
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita navegar para o chat quando clicar no botão de excluir
    await deleteWindow(chatId);
    if (currentChatId === chatId) {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert("Você saiu do sistema.");
      navigate("/login");
    } catch (error) {
      alert("Erro ao sair. Tente novamente.");
    }
  };

  const SidebarContent = () => (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-lg"
          onClick={() => setIsModalOpen(true)}
        >
          + Nova Conversa
        </Button>
      </div>

      <Separator className="bg-gray-700" />

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-gray-400 mb-2">Nenhuma conversa ainda</p>
            <p className="text-xs text-gray-500">
              Clique em "Nova Conversa" para começar!
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 relative group ${
                currentChatId === chat.id
                  ? "bg-gray-700 border border-gray-600"
                  : "hover:bg-gray-800"
              }`}
              onClick={() => {
                navigate(`/chat/${chat.id}`);
                if (isMobile && onOpenChange) {
                  onOpenChange(false);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate pr-2">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-1 pr-2">
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(chat.createdAt.toString())}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                >
                  <MdDelete size={12} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex justify-between border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {userLogged?.displayName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm">
            {userLogged?.displayName?.split(" ")[0]}
          </span>
        </div>

        <Button onClick={handleLogout}>
          <CgLogOut size={28} />
        </Button>
      </div>

      {/* Modal para criar nova conversa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Digite um título para sua nova conversa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">
                Título
              </label>
              <Input
                id="title"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Análise de documentos"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateConversation();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelConversation}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleCreateConversation}
              disabled={!conversationTitle.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Desktop: sidebar fixa
  if (!isMobile) {
    return (
      <div className="w-64 h-screen">
        <SidebarContent />
      </div>
    );
  }

  // Mobile: drawer/sheet
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-80 sm:w-64">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
