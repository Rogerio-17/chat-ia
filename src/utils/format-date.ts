export function formatDate(dateValue: string | undefined) {
  if (!dateValue) {
    return new Date().toLocaleDateString("pt-BR");
  }

  try {
    // Tenta converter como timestamp primeiro
    const timestamp = parseInt(dateValue);

    // Verifica se é um timestamp válido (maior que 0 e não NaN)
    if (!isNaN(timestamp) && timestamp > 0) {
      return new Date(timestamp).toLocaleDateString("pt-BR");
    }

    // Se não for timestamp, tenta como string de data
    const date = new Date(dateValue);

    // Verifica se a data é válida
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("pt-BR");
    }

    // Se nada funcionar, retorna data atual
    return new Date().toLocaleDateString("pt-BR");
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return new Date().toLocaleDateString("pt-BR");
  }
}
