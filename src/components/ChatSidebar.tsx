import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useLimits } from "@/hooks/use-limits";
import { formatDate } from "@/utils/format-date";
import type { Window } from "@/server/firebase-services";
import { auth } from "@/server/firebase-client";
import { toast } from "react-toastify";

interface ChatSidebarProps {
  chats: Window[];
  currentChatId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isModalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
}

// Schema de validação com Zod
const conversationSchema = z.object({
  title: z
    .string()
    .min(1, "O título é obrigatório")
    .max(100, "Título muito longo"),
});

type ConversationFormData = z.infer<typeof conversationSchema>;

export function ChatSidebar({
  chats,
  currentChatId,
  isOpen,
  onOpenChange,
  isModalOpen: externalIsModalOpen,
  onModalOpenChange,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [internalIsModalOpen, setInternalIsModalOpen] = useState(false);
  const { createWindow, userLogged, deleteWindow } = useConversations();
  const { canCreateWindow, isAdmin } = useLimits();

  // Usar o estado externo se fornecido, caso contrário usar o interno
  const isModalOpen = externalIsModalOpen ?? internalIsModalOpen;
  const setIsModalOpen = onModalOpenChange ?? setInternalIsModalOpen;

  // Configuração do React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConversationFormData>({
    resolver: zodResolver(conversationSchema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (data: ConversationFormData) => {
    try {
      const { windowId } = await createWindow(data.title.trim());
      navigate(`/chat/${windowId}`);
      setIsModalOpen(false);
      reset();
      if (isMobile && onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      // O erro já é tratado no hook useConversations
    }
  };

  const handleCancelConversation = () => {
    setIsModalOpen(false);
    reset();
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
      toast.success("Você saiu do sistema.");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair. Tente novamente.");
    }
  };

  const handleCreateNewChat = () => {
    if (!canCreateWindow()) {
      toast.warning(
        "Você já atingiu o limite de 1 conversa com até 5 mensagens."
      );
      return;
    }
    setIsModalOpen(true);
  };

  const SidebarContent = () => (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="mt-8 md:mt-0 p-4">
        <Button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreateNewChat}
          disabled={!canCreateWindow()}
        >
          + Nova Conversa
        </Button>
        {!isAdmin && !canCreateWindow() && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Limite de 1 conversa atingido
          </p>
        )}
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
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`p-1 h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/10 ${
                      isMobile
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    } transition-opacity`}
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    <MdDelete size={12} />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex justify-between border-t border-gray-700">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {userLogged?.displayName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm truncate">
            {userLogged?.displayName?.split(" ")[0]}
          </span>
        </div>

        <Button
          onClick={handleLogout}
          size="sm"
          variant="ghost"
          className="flex-shrink-0 ml-2"
        >
          <CgLogOut size={20} />
        </Button>
      </div>

      {/* Modal para criar nova conversa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className={`${
            isMobile ? "w-[95vw] max-w-[400px]" : "sm:max-w-[425px]"
          }`}
        >
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Digite um título para sua nova conversa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div
                className={`grid ${
                  isMobile ? "grid-cols-1 gap-2" : "grid-cols-4 gap-4"
                } items-center`}
              >
                {!isMobile && (
                  <label htmlFor="title" className="text-right">
                    Título
                  </label>
                )}
                <div className={isMobile ? "col-span-1" : "col-span-3"}>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Ex: Análise de documentos"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter
              className={`${isMobile ? "flex-col-reverse gap-2" : ""}`}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelConversation}
                disabled={isSubmitting}
                className={isMobile ? "w-full" : ""}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={isMobile ? "w-full" : ""}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Criando...
                  </div>
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </form>
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
