// Lista real e verificada dos grupos "Workshop Vagas Internacionais" onde
// o bot (nina_web3) É DE VERDADE membro — levantada manualmente pelo Pedro
// direto no WhatsApp (planilha "lista_master_grupos_workshop.csv"),
// substituindo o levantamento antigo (blackFriday.js) que tinha vários
// grupos marcados errado (a Evolution API às vezes retorna "sucesso" mesmo
// sem o bot ser membro de verdade — só essa lista é confiável).
//
// Os que NÃO são membro (bot removido/nunca foi adicionado) ficam de fora
// daqui de propósito — não tem como mandar nada pra eles via API até
// alguém readicionar o bot manualmente no grupo.
//
// `linkPlanilha`: link de convite coletado manualmente na hora do
// levantamento — não depende da Evolution API (que só entrega link pra
// quem é admin, e o bot não é admin na maioria desses grupos antigos).
export const GRUPOS_LIVE1_REAIS = [
  { id: "120363407645440235@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/E2Y40AKqAA6KzA636Nc0DE" },
  { id: "120363425907006756@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GFcYcYG2Rsu3FGQ8a5C7X0" },
  { id: "120363426688507587@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GfnM5EzX9786oMRz2Xbk5v" },
  { id: "120363424645886835@g.us", nome: "Última chance - Workshop Vagas Internacionais - Segunda edição!", linkPlanilha: "https://chat.whatsapp.com/GecOCpU3MBgJ6T1WySNPFs" },
  { id: "120363425701839407@g.us", nome: "Última chance - Workshop Vagas Internacionais - Segunda Edição!", linkPlanilha: "https://chat.whatsapp.com/EB1kceber7W78ujYIP9UP7" },
  { id: "120363426948202586@g.us", nome: "Última chance - Workshop Vagas Internacionais - Segunda Edição!", linkPlanilha: "https://chat.whatsapp.com/ByCAUkJCJ2t5qgMdTBCRXG" },
  { id: "120363426830220475@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/D3dDhuxBgHmHxkOSS0xDze" },
  { id: "120363425263622205@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/I1A6GMKx2GMDiaxEnj8RRE" },
  { id: "120363425625985023@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/HKJm4bTihxh1HZazRE23qs" },
  { id: "120363427107551009@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/CpE8Qq807Ye9yudPJk0xJn" },
  { id: "120363425144631026@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GUFlS3enkAR0hKcQueSW1y" },
  { id: "120363428118576661@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/ILViDNuF0kS0ey4KoPIkPO" },
  { id: "120363408576372608@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/ChTpX78cirb19gtthiLMds" },
  { id: "120363425550135798@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/EXTdDQXlSEG6sZI7uSpd5A" },
  { id: "120363425395622574@g.us", nome: "Grupo Encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/HfM4JQSsQp1Hq24QurRYoq" },
  { id: "120363408866290510@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/K2wDsLCzOT30pYsvH8ycuA" },
  { id: "120363426973517383@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/ItrNYohvu6II5tuvTl3m9O" },
  { id: "120363427468586416@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/H1Djr016n7T2OzG6tI0x6n" },
  { id: "120363409995725300@g.us", nome: "Grupo fechado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/BXVnJ21D0ad7aEM2uAcyDW" },
  { id: "120363406597734269@g.us", nome: "Grupo fechado| Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/Lexl0uHb26MIgeEucaPhpm" },
  { id: "120363427373649727@g.us", nome: "Grupo fechado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GKDX0IsyvvKImlG0f8zYft" },
  { id: "120363426428041363@g.us", nome: "Grupo fechado  | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/Fa6vhC0FCjBA8GlJQ5GfXG" },
  { id: "120363408664472377@g.us", nome: "Grupo fechado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/FX4l8VOeBiMF8KVC3crCGf" },
  { id: "120363428531180692@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/HXGzF0R1utC3t3vwTDN59Q" },
  { id: "120363426450501932@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GHrGpWjVF5e0056p7DLoe6" },
  { id: "120363427938865844@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/KQ4DivR44L0EJX6oXUFQMG" },
  { id: "120363410529873606@g.us", nome: "Grupo fechado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/IcfTFfHkvePGqZVNV6rKy2" },
  { id: "120363425665191873@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/EomIbGbtdCv9buvDNWUyuz" },
  { id: "120363410523710610@g.us", nome: "🚨🚨📣 FALTAM 10 MINUTOS-  20hrs | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/EzNmJCOzT5pJBTk7QCshjA" },
  { id: "120363428010131285@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GcvhgQhN8rYFl3FyCayhTm" },
  { id: "120363407880214283@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/JXzbV4qmBChBaxroPZrRm0" },
  { id: "120363409032609832@g.us", nome: "🚨🚨📣 FALTAM 10 MINUTOS | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/BQpf73MIHumDGYez5EOSIK" },
  { id: "120363425912288633@g.us", nome: "Workshop Vagas Internacionais [SIM]", linkPlanilha: "https://chat.whatsapp.com/C2YZiRlxrrj6viD18gMa9C" },
  { id: "120363428877080999@g.us", nome: "📣 Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/DvBMrF95dPOHo2BmP9gPs4" },
  { id: "120363410274853184@g.us", nome: "Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/H0CN5dgm7MDCTlleTzY8aT" },
  { id: "120363409675878137@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/HhP09LdvEXMEP57rdjhYq1" },
  { id: "120363428549129736@g.us", nome: "Última Chance | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/IoOaCol7RwL0XueffIDkle" },
  { id: "120363429917007227@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/LTn7g50uQ1X6ZwGjvfjRGR" },
  { id: "120363427849097403@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/GigruXLNQXaLksqtjYsnbh" },
  { id: "120363428107819254@g.us", nome: "🚨🚨📣 É HOJE -  20hrs | Workshop Vagas Internacionais - 03/09", linkPlanilha: "https://chat.whatsapp.com/DJGPR6iPfD2Fznftbr1jx0" },
  { id: "120363414559889693@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/DqhgHdXPqV65FWPvVabNlA" },
  { id: "120363431273697008@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/EopFPHdqouiAq7CJ4D2Fc6" },
  { id: "120363429311239788@g.us", nome: "📣 Workshop Vagas Internacionais", linkPlanilha: null },
  { id: "120363431490793377@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", linkPlanilha: "https://chat.whatsapp.com/B59nXBaPk0rGpAmU4DTLYh" },
  // ATENÇÃO: os 2 grupos abaixo foram removidos de propósito porque são os
  // grupos ATIVOS de verdade da semana normal (Ao Vivo e Gravado) — não
  // podem NUNCA receber a campanha Live 1. Ficam de fora daqui como
  // primeira camada de proteção, além do filtro dinâmico em
  // idsAtivosDestaSemana() (que consulta o banco ao vivo). Dupla proteção
  // de propósito — não readicionar esses 2 IDs aqui, mesmo que a semana
  // mude, a menos que o Pedro confirme explicitamente que não tem risco:
  // - 120363410001684875@g.us ("É AMANHÃ - 16/09") — grupo Ao Vivo Ativo
  // - 120363431176053725@g.us — grupo Gravado Ativo
];

export function listarGruposLive1Reais() {
  return GRUPOS_LIVE1_REAIS;
}
