import type { JSX } from "react";

export function formatApiResponse(
  text: string,
  isMobile: boolean = false
): JSX.Element[] {
  // Quebra o texto em linhas para processar item por item
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let currentParagraph = "";
  let index = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Verifica se é uma imagem (formato: [IMAGE:url:filename])
    // Regex mais específico para Firebase URLs que podem conter : nos tokens
    const imageMatch = line.match(
      /^\[IMAGE:(https?:\/\/[^:]+(?:\?[^:]*)?):([^\]]+)\]$/
    );

    // Verifica se é uma URL de imagem direta que começa com // (formato legacy)
    const legacyImageMatch = line.match(/^\/\/(.+):(.+)$/);

    if (imageMatch || legacyImageMatch) {
      // Se há um parágrafo acumulado, adiciona antes da imagem
      if (currentParagraph.trim()) {
        elements.push(
          <p
            key={`para-${index++}`}
            className="mb-3 text-gray-700 leading-relaxed"
          >
            {formatInlineMarkdown(currentParagraph.trim())}
          </p>
        );
        currentParagraph = "";
      }

      let imageUrl = "";
      let fileName = "";

      if (imageMatch) {
        [, imageUrl, fileName] = imageMatch;
        console.log("Image detected:", { imageUrl, fileName }); // Debug
      } else if (legacyImageMatch) {
        [, imageUrl, fileName] = legacyImageMatch;
        // Adiciona https: se a URL começar com //
        if (imageUrl.startsWith("firebasestorage.googleapis.com")) {
          imageUrl = `https://${imageUrl}`;
        }
      }

      elements.push(
        <div key={`image-${index++}`} className="mb-4">
          <img
            src={imageUrl}
            alt={fileName}
            className={`${
              isMobile ? "max-w-48 max-h-48" : "max-w-sm max-h-64"
            } rounded-lg border border-gray-200 shadow-sm object-contain bg-gray-50`}
            loading="lazy"
          />
          <p
            className={`text-gray-500 mt-1 ${isMobile ? "text-xs" : "text-xs"}`}
          >
            {fileName}
          </p>
        </div>
      );
      continue;
    }

    // Verifica se há imagem inline no meio do texto (formato atual ou legacy)
    if (
      line.includes("[IMAGE:") ||
      line.includes("//firebasestorage.googleapis.com")
    ) {
      // Se há um parágrafo acumulado, adiciona antes de processar a linha com imagem
      if (currentParagraph.trim()) {
        elements.push(
          <p
            key={`para-${index++}`}
            className="mb-3 text-gray-700 leading-relaxed"
          >
            {formatInlineMarkdown(currentParagraph.trim())}
          </p>
        );
        currentParagraph = "";
      }

      // Processa texto e imagem na mesma linha (formato atual)
      if (line.includes("[IMAGE:")) {
        // Regex mais específico para URLs do Firebase
        const parts = line.split(
          /\[IMAGE:(https?:\/\/[^:]+(?:\?[^:]*)?):([^\]]+)\]/
        );
        for (let j = 0; j < parts.length; j++) {
          if (j % 3 === 0 && parts[j].trim()) {
            // Texto antes/depois da imagem
            elements.push(
              <p
                key={`text-${index++}`}
                className="mb-3 text-gray-700 leading-relaxed"
              >
                {formatInlineMarkdown(parts[j].trim())}
              </p>
            );
          } else if (j % 3 === 1) {
            // URL da imagem
            const imageUrl = parts[j];
            const fileName = parts[j + 1];
            console.log("Inline image detected:", { imageUrl, fileName }); // Debug
            elements.push(
              <div key={`image-${index++}`} className="mb-4">
                <img
                  src={imageUrl}
                  alt={fileName}
                  className={`${
                    isMobile ? "max-w-48 max-h-48" : "max-w-sm max-h-64"
                  } rounded-lg border border-gray-200 shadow-sm object-contain bg-gray-50`}
                  loading="lazy"
                />
                <p
                  className={`text-gray-500 mt-1 ${
                    isMobile ? "text-xs" : "text-xs"
                  }`}
                >
                  {fileName}
                </p>
              </div>
            );
          }
        }
      }
      // Processa formato legacy (//url:filename)
      else if (line.includes("//firebasestorage.googleapis.com")) {
        const parts = line.split(/(\/\/[^:]+):([^:\s]+)/);
        for (let j = 0; j < parts.length; j++) {
          if (j % 3 === 0 && parts[j].trim()) {
            // Texto antes/depois da imagem
            elements.push(
              <p
                key={`text-${index++}`}
                className="mb-3 text-gray-700 leading-relaxed"
              >
                {formatInlineMarkdown(parts[j].trim())}
              </p>
            );
          } else if (j % 3 === 1) {
            // URL da imagem (adiciona https:)
            let imageUrl = parts[j];
            if (imageUrl.startsWith("//")) {
              imageUrl = `https:${imageUrl}`;
            }
            const fileName = parts[j + 1];
            elements.push(
              <div key={`image-${index++}`} className="mb-4">
                <img
                  src={imageUrl}
                  alt={fileName}
                  className={`${
                    isMobile ? "max-w-48 max-h-48" : "max-w-sm max-h-64"
                  } rounded-lg border border-gray-200 shadow-sm object-contain bg-gray-50`}
                  loading="lazy"
                />
                <p
                  className={`text-gray-500 mt-1 ${
                    isMobile ? "text-xs" : "text-xs"
                  }`}
                >
                  {fileName}
                </p>
              </div>
            );
          }
        }
      }
      continue;
    }

    // Verifica se é um título Markdown (formato: "### Título", "## Título", "# Título")
    const titleMatch = line.match(/^(#{1,3})\s*(.+)$/);

    // Verifica se é um item numerado (formato: "1. **Título**:" ou "1. **Título** - Descrição")
    const numberedMatch = line.match(
      /^(\d+)\.\s*\*\*(.*?)\*\*:?\s*-?\s*(.*)?$/
    );

    // Verifica se é um sub-item indentado (formato: "   - Texto")
    const subItemMatch = line.match(/^\s{2,}-\s*(.+)$/);

    if (titleMatch) {
      // Se há um parágrafo acumulado, adiciona antes do título
      if (currentParagraph.trim()) {
        elements.push(
          <p
            key={`para-${index++}`}
            className="mb-3 text-gray-700 leading-relaxed"
          >
            {formatInlineMarkdown(currentParagraph.trim())}
          </p>
        );
        currentParagraph = "";
      }

      const [, hashes, titleText] = titleMatch;
      const level = hashes.length;

      // Define classes baseadas no nível do título
      let titleClass = "";
      let Component: "h1" | "h2" | "h3" = "h3";

      switch (level) {
        case 1:
          titleClass = "text-2xl font-bold text-gray-900 mb-4 mt-6";
          Component = "h1";
          break;
        case 2:
          titleClass = "text-xl font-semibold text-gray-900 mb-3 mt-5";
          Component = "h2";
          break;
        case 3:
          titleClass = "text-lg font-semibold text-gray-900 mb-2 mt-4";
          Component = "h3";
          break;
      }

      elements.push(
        <Component key={`title-${index++}`} className={titleClass}>
          {titleText.trim()}
        </Component>
      );
    } else if (numberedMatch) {
      // Se há um parágrafo acumulado, adiciona antes do item numerado
      if (currentParagraph.trim()) {
        elements.push(
          <p
            key={`para-${index++}`}
            className="mb-3 text-gray-700 leading-relaxed"
          >
            {formatInlineMarkdown(currentParagraph.trim())}
          </p>
        );
        currentParagraph = "";
      }

      const [, number, title, description] = numberedMatch;

      // Coleta sub-itens (linhas seguintes indentadas)
      const subItems: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextSubItem = nextLine.match(/^\s{2,}-\s*(.+)$/);
        const nextNumbered = nextLine.match(/^\d+\./);

        if (nextSubItem) {
          subItems.push(nextSubItem[1]);
          j++;
        } else if (nextLine.trim() === "") {
          j++;
        } else if (nextNumbered) {
          break;
        } else {
          // Linha que faz parte da descrição do item atual
          if (nextLine.trim()) {
            subItems.push(nextLine.trim());
          }
          j++;
        }
      }

      // Atualiza o índice para pular as linhas já processadas
      i = j - 1;

      elements.push(
        <div key={`item-${index++}`} className="mb-4">
          <div className="flex items-start gap-2">
            <span className="font-bold text-gray-900">{number}.</span>
            <div className="flex-1">
              <span className="font-semibold text-gray-900">{title}</span>
              {description && ": " + description}
              {subItems.length > 0 && (
                <div className="mt-2 ml-2">
                  {subItems.map((subItem, subIndex) => (
                    <p
                      key={subIndex}
                      className="text-gray-600 text-sm leading-relaxed mb-1"
                    >
                      {formatInlineMarkdown(subItem)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (!subItemMatch && line.trim()) {
      // Acumula texto normal em parágrafos (ignora sub-items aqui pois já foram processados)
      if (currentParagraph) {
        currentParagraph += " " + line.trim();
      } else {
        currentParagraph = line.trim();
      }
    } else if (line.trim() === "" && currentParagraph.trim()) {
      // Linha vazia indica fim do parágrafo
      elements.push(
        <p
          key={`para-${index++}`}
          className="mb-3 text-gray-700 leading-relaxed"
        >
          {formatInlineMarkdown(currentParagraph.trim())}
        </p>
      );
      currentParagraph = "";
    }
  }

  // Adiciona o último parágrafo se houver
  if (currentParagraph.trim()) {
    elements.push(
      <p key={`para-${index++}`} className="mb-3 text-gray-700 leading-relaxed">
        {formatInlineMarkdown(currentParagraph.trim())}
      </p>
    );
  }

  return elements;
}

// Função auxiliar para processar markdown inline (negrito, itálico, etc.)
function formatInlineMarkdown(text: string): JSX.Element {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          // Texto em negrito
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        } else if (
          part.startsWith("*") &&
          part.endsWith("*") &&
          !part.startsWith("**")
        ) {
          // Texto em itálico
          return (
            <em key={index} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        } else {
          // Texto normal
          return <span key={index}>{part}</span>;
        }
      })}
    </>
  );
}
