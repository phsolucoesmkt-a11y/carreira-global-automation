const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// Converte "50 18 * * 1" em "Segunda-feira, 18h50" pra mostrar na tela.
// Só cobre o formato usado aqui (minuto hora * * dia-da-semana) — não é
// um parser de cron genérico.
export function cronParaTexto(expressao) {
  const partes = expressao.trim().split(/\s+/);
  if (partes.length !== 5) return expressao;
  const [min, hora, diaMes, mes, diaSemana] = partes;
  const minutosIntervalo = min.match(/^\*\/(\d+)$/);
  if (minutosIntervalo && hora === "*" && diaSemana === "*") {
    return `A cada ${minutosIntervalo[1]} minutos`;
  }
  const horaFmt = String(hora).padStart(2, "0");
  const minFmt = String(min).padStart(2, "0");
  // Data fixa (dia/mês), usado em campanhas pontuais que não recorrem toda
  // semana — ex: "0 14 15 9 *" = 15/09 às 14h, em vez de dia-da-semana.
  if (diaMes !== "*" && mes !== "*") {
    return `${String(diaMes).padStart(2, "0")}/${String(mes).padStart(2, "0")}, ${horaFmt}h${minFmt}`;
  }
  const dia = DIAS[Number(diaSemana)] ?? `dia ${diaSemana}`;
  return `${dia}, ${horaFmt}h${minFmt}`;
}
