// Campos editáveis da "Recuperação de leads". Nasce em modo "simulacao" e
// sem template: não envia nada até alguém preencher o nome do template
// aprovado no Meta e trocar o modo pra "real".
export const TEXTOS_RECUPERACAO_PADRAO = {
  "recuperacao-leads": {
    modo: "simulacao", // "simulacao" (só calcula quem receberia) | "real"
    templateAoVivo: "", // nome exato do template aprovado (Ao Vivo)
    templateGravado: "", // nome exato do template aprovado (Gravado)
    idioma: "pt_BR",
    // Só se o template tiver botão de URL dinâmica (https://dominio/r/{{1}}):
    // o que entra no lugar do {{1}}. Vazio = template com botão de URL fixa.
    botaoSufixoAoVivo: "",
    botaoSufixoGravado: "",
    esperaMinutos: 30, // só recupera quem se cadastrou há mais que isso
    janelaHoras: 48, // ignora leads mais velhos que isso
    frescorMinutos: 30, // só envia se a sincronização de membros for mais nova que isso
    loteMaximo: 10, // templates por execução (cron de 5 em 5 min)
  },
};
