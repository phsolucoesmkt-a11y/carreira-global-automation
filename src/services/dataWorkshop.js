// Calcula a data (DD/MM) do próximo dia de workshop a partir de agora — se
// hoje já for o dia do workshop, usa hoje mesmo. Usado pra incluir a data
// no nome dos grupos, nos fluxos que renomeiam mostrando a identidade do
// workshop (não nos renomeios cosméticos de encerramento).
function dataDoProximoDiaSemana(diaSemanaAlvo) {
  const hoje = new Date();
  const diaAtual = hoje.getDay();
  const diff = (diaSemanaAlvo - diaAtual + 7) % 7;
  const alvo = new Date(hoje);
  alvo.setDate(hoje.getDate() + diff);
  const dd = String(alvo.getDate()).padStart(2, "0");
  const mm = String(alvo.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

// Gravado: workshop é quinta-feira (4).
export const dataDoWorkshopGravado = () => dataDoProximoDiaSemana(4);

// Ao Vivo: workshop é quarta-feira (3).
export const dataDoWorkshopAoVivo = () => dataDoProximoDiaSemana(3);
