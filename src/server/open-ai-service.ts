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

export async function SendOpenAi({
  message,
  imageUrl,
}: OpenAiRequest): Promise<OpenAiResponse> {
  try {
    // Monta o conteúdo da mensagem baseado na presença da imagem
    const content = [];

    // Sempre adiciona o texto
    content.push({
      type: "text",
      text: message,
    });

    // Adiciona imagem se existir
    if (imageUrl) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      });
    }

    console.log("Sending to OpenAI via Vercel API route:", { message, imageUrl, content });

    // Chama a API route da Vercel (/api/openai.ts)
    const response = await fetch("/api/openai", {
      method: "POST",
      headers: {
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
      console.error("Vercel API Error:", errorData);
      throw new Error(`Erro OpenAI: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("OpenAI Response:", data);

    return data as OpenAiResponse;
  } catch (error) {
    console.error("Erro ao fazer requisição para OpenAI:", error);
    throw error;
  }
}
