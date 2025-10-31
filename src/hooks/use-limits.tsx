import { useConversations } from "./use-conversation";

export function useLimits() {
  const { windows, userLogged, conversations } = useConversations();

  const isAdmin = userLogged?.email === "rogeriojmf10@gmail.com";

  // Verificar se pode criar nova janela
  const canCreateWindow = () => {
    if (isAdmin) return true;
    return windows.length === 0;
  };

  // Verificar se pode enviar mensagem
  const canSendMessage = (windowId: string) => {
    if (isAdmin) return true;

    // Contar apenas mensagens do usuário na conversa atual
    const userMessages = conversations.filter((m) => m.type === "user");
    return userMessages.length < 5;
  };

  // Obter número de mensagens restantes
  const getRemainingMessages = (windowId: string) => {
    if (isAdmin) return Infinity;

    const userMessages = conversations.filter((m) => m.type === "user");
    return Math.max(0, 5 - userMessages.length);
  };

  return {
    isAdmin,
    canCreateWindow,
    canSendMessage,
    getRemainingMessages,
  };
}
