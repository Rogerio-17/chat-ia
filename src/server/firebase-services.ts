import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { v4 as uuidV4 } from "uuid";
import { api, storage } from "./firebase-client";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export interface ConversationMessageRequest {
  windowId: string;
  type: "user" | "bot";
  content: string;
}

export interface ConversationMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  createdAt: number;
}

export interface WindowRequest {
  authorEmail: string;
  title: string;
}

export interface Window {
  id: string;
  authorEmail: string;
  title: string;
  messages: ConversationMessageRequest[];
  createdAt: number;
  // expiresAt: number; vou expirar o chat depois de 24 horas
}

export async function CreateWindow({
  authorEmail,
  title,
}: WindowRequest): Promise<{ window: Window }> {
  const id = uuidV4();

  const newWindow = {
    authorEmail,
    title,
    messages: [] as ConversationMessageRequest[],
    createdAt: Date.now(),
  };

  try {
    await setDoc(doc(collection(api, "windows"), id), newWindow);
    return { window: { ...newWindow, id } };
  } catch (error) {
    console.error("Error saving conversation history: ", error);
    throw new Error("Failed to save conversation history");
  }
}

export async function DeleteWindow(windowId: string): Promise<void> {
  try {
    await deleteDoc(doc(api, "windows", windowId));
  } catch (error) {
    console.error("Error deleting window: ", error);
    throw new Error("Failed to delete window");
  }
}

export async function CreateConversationHistory({
  type,
  content,
  windowId,
}: ConversationMessageRequest): Promise<{ message: ConversationMessage }> {
  const windowsRef = doc(api, "windows", windowId);
  const docSnap = await getDoc(windowsRef);
  const existingData = docSnap.exists() ? docSnap.data() : null;

  if (!existingData) {
    throw new Error("Window not found");
  }

  const id = uuidV4();

  const newMessage: ConversationMessage = {
    id,
    type,
    content,
    createdAt: Date.now(),
  };

  try {
    const existingMessages = existingData.messages || [];

    await setDoc(
      windowsRef,
      {
        messages: [...existingMessages, newMessage],
      },
      { merge: true }
    );

    return { message: newMessage };
  } catch (error) {
    console.error("Error saving message: ", error);
    throw new Error("Failed to save message");
  }
}

export async function GetConversationByWindowId(windowId: string) {
  const windowsRef = doc(api, "windows", windowId);
  const docSnap = await getDoc(windowsRef);
  const existingData = docSnap.exists() ? docSnap.data() : null;

  if (!existingData) {
    throw new Error("Window not found");
  }

  return existingData.messages as ConversationMessage[];
}

export async function imageUpload(file: File): Promise<{
  imageUrl: string;
}> {
  try {
    const imageId = uuidV4();
    const storageRef = ref(storage, `chat-images/${imageId}`);

    // Calcular data de expiração (30 dias a partir de agora)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    // Metadata com informações de expiração
    const metadata = {
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        expiresAt: expirationDate.toISOString(),
        autoDelete: "true",
        uploadedBy: "chat-system",
      },
    };

    // Upload com metadata
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const imageUrl = await getDownloadURL(snapshot.ref);

    return { imageUrl };
  } catch (error) {
    throw new Error("Failed to upload image");
  }
}

export async function GetAllWindowsByEmail(email: string) {
  const windowsRef = collection(api, "windows");
  const q = query(windowsRef, where("authorEmail", "==", email));
  const querySnapshot = await getDocs(q);
  const windows: Window[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as Window;
    windows.push({ ...data, id: doc.id });
  });

  return windows;
}
