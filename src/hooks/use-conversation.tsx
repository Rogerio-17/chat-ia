"use client";
import { auth } from "@/server/firebase-client";
import {
  CreateConversationHistory,
  CreateWindow,
  DeleteWindow,
  GetAllWindowsByEmail,
  GetConversationByWindowId,
  imageUpload as firebaseImageUpload,
  type ConversationMessage,
  type ConversationMessageRequest,
  type Window,
} from "@/server/firebase-services";
import { SendOpenAi, type OpenAiRequest } from "@/server/open-ai-service";
import { compressImage } from "@/utils/compressFile";
import type { User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface ConversationsContextProps {
  fetchConversationByWindowId: (windowId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  conversations: ConversationMessage[];
  createConversation: (
    conversation: ConversationMessageRequest
  ) => Promise<void>;
  createResponseWithOpenAI: (
    message: OpenAiRequest,
    windowId: string
  ) => Promise<void>;
  loadingAiResponse: boolean;
  setLoadingAiResponse: (loading: boolean) => void;
  createWindow: (title: string) => Promise<{ windowId: string }>;
  getAllWindows: () => Promise<void>;
  windows: Window[];
  userLogged: User | null;
  authLoading: boolean;
  deleteWindow: (windowId: string) => Promise<void>;
  imageUpload: (file: File) => Promise<{ imageUrl: string }>;
}

const ConversationsContext = createContext<
  ConversationsContextProps | undefined
>(undefined);

export const ConversationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingAiResponse, setLoadingAiResponse] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [userLogged, setUserLogged] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserLogged(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function createWindow(title: string): Promise<{ windowId: string }> {
    if (!userLogged) {
      throw new Error("Usuário não autenticado");
    }

    if (!userLogged.email) {
      throw new Error("Usuário não possui email cadastrado");
    }

    try {
      const { window } = await CreateWindow({
        authorEmail: userLogged.email,
        title,
      });

      setWindows((prev) => [...prev, window]);

      return { windowId: window.id };
    } catch (error) {
      alert("Erro ao criar nova conversa. Tente novamente.");
      throw error;
    }
  }

  async function deleteWindow(windowId: string): Promise<void> {
    try {
      await DeleteWindow(windowId);
      setWindows((prev) => prev.filter((window) => window.id !== windowId));
      alert("Conversa excluída com sucesso.");
    } catch (error) {
      alert("Erro ao excluir conversa. Tente novamente.");
      console.error("Error deleting window:", error);
    }
  }

  async function createConversation(
    conversation: ConversationMessageRequest
  ): Promise<void> {
    setLoading(true);
    try {
      const { message } = await CreateConversationHistory(conversation);
      setConversations((prev) => [...prev, message]);
      return;
    } catch (err) {
      setError(err as Error);
      return;
    } finally {
      setLoading(false);
    }
  }

  async function imageUpload(file: File): Promise<{ imageUrl: string }> {
    setLoading(true);
    try {
      const compressedFile = await compressImage(file);

      console.log(
        "Compressed file size:",
        (compressedFile.size / 1024).toFixed(2),
        "KB"
      );

      console.log("Original file size:", (file.size / 1024).toFixed(2), "KB");
      const { imageUrl } = await firebaseImageUpload(compressedFile);
      return { imageUrl };
    } catch (err) {
      setError(err as Error);
      return { imageUrl: "" };
    } finally {
      setLoading(false);
    }
  }

  async function fetchConversationByWindowId(windowId: string): Promise<void> {
    setLoading(true);
    try {
      const conversation = await GetConversationByWindowId(windowId);
      setConversations(conversation);
      return;
    } catch (err) {
      setError(err as Error);
      return;
    } finally {
      setLoading(false);
    }
  }

  async function createResponseWithOpenAI(
    message: OpenAiRequest,
    windowId: string
  ) {
    console.log("Starting createResponseWithOpenAI:", { message, windowId });
    setLoadingAiResponse(true);

    try {
      console.log("Calling SendOpenAi...");
      const response = await SendOpenAi({
        message: message.message,
        imageUrl: message.imageUrl,
      });

      console.log("OpenAI response received:", response);

      if (!response) {
        alert("Erro ao obter resposta do OpenAI. Tente novamente.");
        throw new Error("No response from OpenAI");
      }

      console.log("Saving AI response to conversation...");
      await createConversation({
        type: "bot",
        content: response.choices[0].message.content,
        windowId,
      });

      console.log("AI response saved successfully");
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      alert("Erro ao gerar resposta da IA. Tente novamente.");
      throw error;
    } finally {
      setLoadingAiResponse(false);
      console.log("Loading AI response finished");
    }
  }

  async function getAllWindows() {
    if (!userLogged) {
      throw new Error("Usuário não autenticado");
    }

    if (!userLogged.email) {
      throw new Error("Usuário não possui email cadastrado");
    }

    try {
      const allWindows = await GetAllWindowsByEmail(userLogged.email);
      setWindows(allWindows);
    } catch (error) {
      alert("Erro ao buscar chats. Tente novamente.");
      console.error("Error fetching windows:", error);
    }
  }

  return (
    <ConversationsContext.Provider
      value={{
        fetchConversationByWindowId,
        loading,
        error,
        conversations,
        createConversation,
        createResponseWithOpenAI,
        loadingAiResponse,
        setLoadingAiResponse,
        createWindow,
        getAllWindows,
        windows,
        userLogged,
        authLoading,
        deleteWindow,
        imageUpload,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error(
      "useConversations must be used within a ConversationsProvider"
    );
  }
  return context;
};
