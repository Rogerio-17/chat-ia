import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MdAttachFile, MdClose, MdMenu } from "react-icons/md";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useConversations } from "@/hooks/use-conversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLimits } from "@/hooks/use-limits";
import type { ConversationMessage } from "@/server/firebase-services";
import { formatDate } from "@/utils/format-date";
import { formatApiResponse } from "@/utils/formatApiResponse";
import { toast } from "react-toastify";

interface ChatAreaProps {
  chatId?: string;
  messages?: ConversationMessage[];
  onMenuClick?: () => void;
  onNewChatClick?: () => void;
}

// Schema de validação com Zod
const messageSchema = z.object({
  message: z.string(),
});

type MessageFormData = z.infer<typeof messageSchema>;

export function ChatArea({
  chatId,
  messages = [],
  onMenuClick,
  onNewChatClick,
}: ChatAreaProps) {
  let imageUrlUploaded = "";
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuração do React Hook Form
  const { register, handleSubmit, reset, watch } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Observa o valor da mensagem para placeholder dinâmico
  const messageValue = watch("message");
  const {
    createConversation,
    createResponseWithOpenAI,
    loadingAiResponse,
    userLogged,
    imageUpload,
  } = useConversations();
  const { canSendMessage, getRemainingMessages, isAdmin } = useLimits();

  // Função para fazer scroll para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll automático quando mensagens mudam ou quando está carregando
  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingAiResponse]);

  // Função para lidar com seleção de imagem
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover imagem selecionada
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Função para processar o envio do formulário
  const onSubmit = async (data: MessageFormData) => {
    setLoading(true);
    if (!chatId) {
      setLoading(false);
      toast.error("Selecione uma conversa ou crie uma nova.");
      return;
    }

    // Verificar limite de mensagens
    if (!canSendMessage(chatId)) {
      setLoading(false);
      toast.warning("Você atingiu o limite de 5 mensagens nesta conversa.");
      return;
    }

    if (!data.message.trim() && !selectedImage) {
      setLoading(false);
      return;
    }

    let messageContent = data.message;

    try {
      // Se há imagem, fazer upload APENAS no momento do envio
      if (selectedImage) {
        const { imageUrl } = await imageUpload(selectedImage);
        messageContent = `${data.message}${
          data.message.trim() ? "\n\n" : ""
        }[IMAGE:${imageUrl}:${selectedImage.name}]`;
        imageUrlUploaded = imageUrl;
      }

      // PASSO 1: Salvar mensagem do usuário PRIMEIRO
      await createConversation({
        windowId: chatId,
        type: "user",
        content: messageContent,
      });

      // PASSO 2: Limpar formulário e imagem IMEDIATAMENTE após salvar
      reset();
      removeSelectedImage();

      // PASSO 3: Scroll para baixo após enviar mensagem
      setTimeout(scrollToBottom, 100);

      // PASSO 4: Gerar resposta da IA (loading é controlado automaticamente)
      await createResponseWithOpenAI(
        { message: messageContent, imageUrl: imageUrlUploaded },
        chatId
      );

      setLoading(false);
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      setLoading(false);
    }
  };

  // Função para lidar com Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  // Verificar limites
  const remainingMessages = chatId ? getRemainingMessages(chatId) : 0;
  const canSend = chatId ? canSendMessage(chatId) : false;

  if (!chatId || chatId === "new") {
    return (
      <div
        className={`flex-1 flex flex-col ${
          isMobile ? "h-screen" : "h-full"
        } bg-white overflow-hidden overflow-x-hidden`}
      >
        {/* Header Mobile - Melhorado */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0 fixed top-0 left-0 right-0 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="flex items-center gap-1 p-2"
            >
              <MdMenu size={20} />
            </Button>
            <Button
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2"
              onClick={onNewChatClick}
            >
              + Nova conversa
            </Button>
          </div>
        )}

        <div
          className={`flex-1 flex items-center justify-center ${
            isMobile ? "pt-16 pb-32" : ""
          }`}
        >
          <div className="text-center px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2
              className={`${
                isMobile ? "text-lg" : "text-xl"
              } font-semibold text-gray-900 mb-2`}
            >
              Como posso ajudar você hoje?
            </h2>
            <p className={`text-gray-600 ${isMobile ? "text-sm" : ""}`}>
              Selecione uma conversa ou inicie uma nova
            </p>
          </div>
        </div>

        {/* Input area */}
        <div
          className={`border-t bg-white p-4 shrink-0 ${
            isMobile ? "fixed bottom-0 left-0 right-0 z-10" : ""
          }`}
        >
          <div className={`max-w-3xl mx-auto ${isMobile ? "px-0" : ""}`}>
            {/* Preview da imagem */}
            {imagePreview && (
              <div
                className={`mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 ${
                  isMobile ? "mx-2" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className={`object-cover rounded-lg ${
                        isMobile ? "w-16 h-16" : "w-20 h-20"
                      }`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      onClick={removeSelectedImage}
                    >
                      <MdClose size={12} />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-gray-700 mb-1 truncate ${
                        isMobile ? "text-xs" : "text-sm"
                      }`}
                    >
                      {selectedImage?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedImage
                        ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className={`flex items-end ${isMobile ? "gap-2" : "gap-3"}`}
            >
              <div className="flex-1 relative">
                <Textarea
                  {...register("message")}
                  placeholder={
                    selectedImage
                      ? "Adicione uma descrição para a imagem..."
                      : "Envie uma mensagem"
                  }
                  rows={1}
                  className={`resize-none min-h-[52px] max-h-32 ${
                    isMobile ? "rounded-lg text-base" : "rounded-xl"
                  } border-gray-300 focus:border-gray-400 focus:ring-0 pr-12`}
                  onKeyDown={handleKeyDown}
                  disabled={loadingAiResponse || !chatId || loading}
                />
                {/* Botão de anexo */}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 bottom-2 w-8 h-8 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingAiResponse || !chatId || loading}
                >
                  <MdAttachFile size={16} />
                </Button>
              </div>

              <Button
                type="submit"
                className={`bg-gray-800 hover:bg-gray-700 text-white h-[52px] w-[52px] p-0 ${
                  isMobile ? "rounded-lg" : "rounded-xl"
                }`}
                disabled={
                  (!messageValue?.trim() && !selectedImage) ||
                  loadingAiResponse ||
                  loading
                }
              >
                {loadingAiResponse || loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </Button>
            </form>

            {/* Input de arquivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col ${
        isMobile ? "h-screen" : "h-full"
      } bg-white overflow-hidden`}
    >
      {/* Header Mobile - Melhorado */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0 fixed top-0 left-0 right-0 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="flex items-center gap-1 p-2"
          >
            <MdMenu size={20} />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 ">Chat</h1>
          <Button
            size="sm"
            className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2"
            onClick={onNewChatClick}
          >
            + Nova conversa
          </Button>
        </div>
      )}

      {/* Messages area */}
      <div
        className={`flex-1 overflow-y-auto min-h-0 ${
          isMobile ? "pt-16 pb-26" : ""
        }`}
      >
        <div
          className={`max-w-3xl mx-auto space-y-6 ${
            isMobile ? "p-3 pb-0" : "p-4 pb-3"
          }`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMobile ? "gap-3" : "gap-4"}`}
            >
              <div
                className={`${
                  isMobile ? "w-7 h-7" : "w-8 h-8"
                } rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === "user" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                <span
                  className={`text-white ${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium`}
                >
                  {message.type === "user"
                    ? userLogged?.displayName?.charAt(0).toUpperCase()
                    : "IA"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`${
                    isMobile ? "text-sm" : "text-sm"
                  } font-medium mb-1`}
                >
                  {message.type === "user" ? "Você" : "IA"}
                </div>
                <div
                  className={`text-gray-900 leading-relaxed whitespace-pre-wrap ${
                    isMobile ? "text-sm" : ""
                  }`}
                >
                  {formatApiResponse(message.content, isMobile)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {formatDate(message.createdAt.toString())}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loadingAiResponse ||
            (loading && (
              <div className={`flex ${isMobile ? "gap-3" : "gap-4"}`}>
                <div
                  className={`${
                    isMobile ? "w-7 h-7" : "w-8 h-8"
                  } bg-green-600 rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <span
                    className={`text-white ${
                      isMobile ? "text-xs" : "text-sm"
                    } font-medium`}
                  >
                    AI
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`${
                      isMobile ? "text-sm" : "text-sm"
                    } font-medium mb-1`}
                  >
                    ChatGPT
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

          {/* Elemento invisível para servir como âncora do scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className={`border-t bg-white p-4 shrink-0 ${
          isMobile ? "fixed bottom-0 left-0 right-0 z-10" : ""
        }`}
      >
        <div className="max-w-3xl mx-auto">
          {/* Aviso de limite */}
          {!isAdmin && chatId && chatId !== "new" && (
            <div className="mb-2 text-center">
              <p className="text-xs text-gray-500">
                {remainingMessages > 0
                  ? `${remainingMessages} ${
                      remainingMessages === 1
                        ? "mensagem restante"
                        : "mensagens restantes"
                    }`
                  : "Limite de mensagens atingido"}
              </p>
            </div>
          )}

          {/* Preview da imagem */}
          {imagePreview && (
            <div
              className={`mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 ${
                isMobile ? "mx-0" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={`object-cover rounded-lg ${
                      isMobile ? "w-16 h-16" : "w-20 h-20"
                    }`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    onClick={removeSelectedImage}
                  >
                    <MdClose size={12} />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-gray-700 mb-1 truncate ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {selectedImage?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedImage
                      ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={`flex items-end ${isMobile ? "gap-2" : "gap-3"}`}
          >
            <div className="flex-1 relative">
              <Textarea
                {...register("message")}
                placeholder={
                  !canSend
                    ? "Limite de mensagens atingido"
                    : selectedImage
                    ? "Adicione uma descrição para a imagem..."
                    : "Envie uma mensagem para a IA"
                }
                rows={1}
                className={`resize-none min-h-[52px] max-h-32 ${
                  isMobile ? "rounded-lg text-base" : "rounded-xl"
                } border-gray-300 focus:border-gray-400 focus:ring-0 pr-12`}
                onKeyDown={handleKeyDown}
                disabled={!canSend || loadingAiResponse || loading}
              />
              {/* Botão de anexo */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-2 bottom-2 w-8 h-8 p-0 text-gray-400 hover:text-gray-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canSend || loadingAiResponse || loading}
              >
                <MdAttachFile size={16} />
              </Button>
            </div>

            <Button
              type="submit"
              className={`bg-gray-800 hover:bg-gray-700 text-white h-[52px] w-[52px] p-0 ${
                isMobile ? "rounded-lg" : "rounded-xl"
              }`}
              disabled={
                !canSend ||
                (!messageValue?.trim() && !selectedImage) ||
                loadingAiResponse ||
                loading
              }
            >
              {loadingAiResponse || loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </Button>
          </form>

          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      </div>
    </div>
  );
}
