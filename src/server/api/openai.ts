// Este arquivo será usado como base para criar um endpoint de API
// Você precisará implementar isso no seu backend (Node.js, Vercel, Netlify, etc.)

export interface OpenAiRequest {
  message: string;
  imageUrl?: string;
}

export interface OpenAiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

// Esta função deve ser movida para o backend
export async function callOpenAI({
  message,
  imageUrl,
}: OpenAiRequest): Promise<OpenAiResponse> {
  const content = [];

  content.push({
    type: "text",
    text: message,
  });

  if (imageUrl) {
    content.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`, // Use variável de ambiente
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro OpenAI: ${response.status} - ${errorData}`);
  }

  return await response.json();
}
