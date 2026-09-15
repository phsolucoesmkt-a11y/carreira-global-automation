// Controle da base de grupos levantada pra Black Friday 2026 (56 grupos
// "Workshop Vagas Internacionais", aprovado por Pedro) e o plano de divisão
// entre as instâncias Evolution API disponíveis (nina_web2 / nina_web3),
// feito por round-robin só pra distribuir as chamadas de API e evitar
// bloqueio por rate-limit num número só. Snapshot estático (não consulta a
// Evolution API) — somente leitura, sem nenhuma ação sobre os grupos reais.
const GRUPOS_BLACK_FRIDAY = [
  { id: "120363423578038766@g.us", nome: "🚨🚨📣AO VIVO EM 1 HORA -  20hrs | Workshop Vagas Internacionais", criadoEm: "04/02/2026", instancia: "nina_web2" },
  { id: "120363428010131285@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "16/06/2026", instancia: "nina_web3" },
  { id: "120363407880214283@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "17/06/2026", instancia: "nina_web2" },
  { id: "120363409032609832@g.us", nome: "🚨🚨📣 FALTAM 10 MINUTOS | Workshop Vagas Internacionais", criadoEm: "18/06/2026", instancia: "nina_web3" },
  { id: "120363428877080999@g.us", nome: "📣 Workshop Vagas Internacionais", criadoEm: "19/06/2026", instancia: "nina_web2" },
  { id: "120363410274853184@g.us", nome: "Workshop Vagas Internacionais", criadoEm: "19/06/2026", instancia: "nina_web3" },
  { id: "120363429048275697@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "24/06/2026", instancia: "nina_web2" },
  { id: "120363410414490764@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "24/06/2026", instancia: "nina_web3" },
  { id: "120363408402441602@g.us", nome: "📣 Workshop Vagas Internacionais", criadoEm: "26/06/2026", instancia: "nina_web2" },
  { id: "120363408901072649@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "28/06/2026", instancia: "nina_web3" },
  { id: "120363427466651165@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "28/06/2026", instancia: "nina_web2" },
  { id: "120363426536072045@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "28/06/2026", instancia: "nina_web3" },
  { id: "120363429668580162@g.us", nome: "Grupo encerrado - Workshop Vagas Internacionais", criadoEm: "28/06/2026", instancia: "nina_web2" },
  { id: "120363411528788417@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "29/06/2026", instancia: "nina_web3" },
  { id: "120363427403451117@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "30/06/2026", instancia: "nina_web2" },
  { id: "120363409594909036@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "01/07/2026", instancia: "nina_web3" },
  { id: "120363407895385301@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "01/07/2026", instancia: "nina_web2" },
  { id: "120363429001403713@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "02/07/2026", instancia: "nina_web3" },
  { id: "120363429767814728@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "02/07/2026", instancia: "nina_web2" },
  { id: "120363428854634337@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "03/07/2026", instancia: "nina_web3" },
  { id: "120363427102093657@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "03/07/2026", instancia: "nina_web2" },
  { id: "120363429044959899@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "04/07/2026", instancia: "nina_web3" },
  { id: "120363425595350548@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "05/07/2026", instancia: "nina_web2" },
  { id: "120363411970256212@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "06/07/2026", instancia: "nina_web3" },
  { id: "120363426969792052@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "07/07/2026", instancia: "nina_web2" },
  { id: "120363427981680219@g.us", nome: "🚨🚨📣 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "07/07/2026", instancia: "nina_web3" },
  { id: "120363412113904058@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "08/07/2026", instancia: "nina_web2" },
  { id: "120363426616386383@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "10/07/2026", instancia: "nina_web3" },
  { id: "120363409842000658@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "14/07/2026", instancia: "nina_web2" },
  { id: "120363410366526942@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "15/07/2026", instancia: "nina_web3" },
  { id: "120363409675878137@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "17/07/2026", instancia: "nina_web2" },
  { id: "120363428104936071@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "21/07/2026", instancia: "nina_web3" },
  { id: "120363411015989450@g.us", nome: "🚨🚨📣#22 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "22/07/2026", instancia: "nina_web2" },
  { id: "120363410566080264@g.us", nome: "🚨🚨📣#22 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "22/07/2026", instancia: "nina_web3" },
  { id: "120363427778125449@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "24/07/2026", instancia: "nina_web2" },
  { id: "120363408385558950@g.us", nome: "🚨🚨📣 Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "28/07/2026", instancia: "nina_web3" },
  { id: "120363411174704584@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "29/07/2026", instancia: "nina_web2" },
  { id: "120363411113636931@g.us", nome: "🚨🚨📣#22 É AMANHÃ -  20hrs | Workshop Vagas Internacionais", criadoEm: "29/07/2026", instancia: "nina_web3" },
  { id: "120363410743618074@g.us", nome: "🚨🚨📣#22 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "29/07/2026", instancia: "nina_web2" },
  { id: "120363411703051581@g.us", nome: "Última Chance - Workshop Vagas Internacionais", criadoEm: "31/07/2026", instancia: "nina_web3" },
  { id: "120363428224067937@g.us", nome: "Última Chance - Workshop Vagas Internacionais", criadoEm: "04/08/2026", instancia: "nina_web2" },
  { id: "120363410691542070@g.us", nome: "🚨🚨📣#22 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "05/08/2026", instancia: "nina_web3" },
  { id: "120363428549129736@g.us", nome: "Última Chance | Workshop Vagas Internacionais", criadoEm: "07/08/2026", instancia: "nina_web2" },
  { id: "120363429177294947@g.us", nome: "Última chance | Workshop Vagas Internacionais", criadoEm: "10/08/2026", instancia: "nina_web3" },
  { id: "120363428284765721@g.us", nome: "Última Chance | Workshop Vagas Internacionais", criadoEm: "11/08/2026", instancia: "nina_web2" },
  { id: "120363429536066426@g.us", nome: "Última chance | Workshop Vagas Internacionais", criadoEm: "12/08/2026", instancia: "nina_web3" },
  { id: "120363429917007227@g.us", nome: "🚨🚨📣 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "14/08/2026", instancia: "nina_web2" },
  { id: "120363413636316327@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "17/08/2026", instancia: "nina_web3" },
  { id: "120363412954149294@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "17/08/2026", instancia: "nina_web2" },
  { id: "120363412272271534@g.us", nome: "🚨🚨📣#07 ESTAMOS AO VIVO | Workshop Vagas Internacionais", criadoEm: "19/08/2026", instancia: "nina_web3" },
  { id: "120363427849097403@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "21/08/2026", instancia: "nina_web2" },
  { id: "120363428387527266@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "21/08/2026", instancia: "nina_web3" },
  { id: "120363427856609948@g.us", nome: "Grupo encerrado | Workshop Vagas Internacionais", criadoEm: "25/08/2026", instancia: "nina_web2" },
  { id: "120363412688426544@g.us", nome: "🚨🚨📣 Última chance | Workshop Vagas Internacionais - 02/09", criadoEm: "28/08/2026", instancia: "nina_web3" },
  { id: "120363428107819254@g.us", nome: "🚨🚨📣 É HOJE -  20hrs | Workshop Vagas Internacionais - 03/09", criadoEm: "28/08/2026", instancia: "nina_web2" },
  { id: "120363411836479514@g.us", nome: "🚨🚨📣 Última chance | Workshop Vagas Internacionais - 02/09", criadoEm: "01/09/2026", instancia: "nina_web3" },
];

export function listarGruposBlackFriday() {
  return GRUPOS_BLACK_FRIDAY;
}

export function resumoInstanciasBlackFriday() {
  const porInstancia = {};
  for (const g of GRUPOS_BLACK_FRIDAY) {
    porInstancia[g.instancia] = (porInstancia[g.instancia] || 0) + 1;
  }
  return { total: GRUPOS_BLACK_FRIDAY.length, porInstancia };
}
