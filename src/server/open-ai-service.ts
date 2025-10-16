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

    // Detecta se está em desenvolvimento ou produção
    const isDevelopment = import.meta.env.DEV;

    console.log(
      `Sending to OpenAI (${isDevelopment ? "development" : "production"}):`,
      {
        message,
        imageUrl,
        content,
      }
    );

    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      max_tokens: 1000,
    };

    let response: Response;

    if (isDevelopment) {
      // Em desenvolvimento: tenta primeiro o proxy, se falhar usa requisição direta
      try {
        response = await fetch("/api/openai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Se o proxy retornar 401 (sem auth), faz requisição direta
        if (response.status === 401) {
          console.log("Proxy falhou, tentando requisição direta...");
          throw new Error("Proxy sem auth, tentando direta");
        }
      } catch (proxyError) {
        console.log("Proxy falhou, fazendo requisição direta para OpenAI");

        // Fallback: requisição direta para OpenAI
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error(
            "VITE_OPENAI_API_KEY não configurada no arquivo .env"
          );
        }

        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }
    } else {
      // Em produção: usa a API route da Vercel
      response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error("API Error:", errorData);
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
