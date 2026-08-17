const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// Converte "50 18 * * 1" em "Segunda-feira, 18h50" pra mostrar na tela.
// Só cobre o formato usado aqui (minuto hora * * dia-da-semana) — não é
// um parser de cron genérico.
export function cronParaTexto(expressao) {
  const partes = expressao.trim().split(/\s+/);
  if (partes.length !== 5) return expressao;
  const [min, hora, , , diaSemana] = partes;
  const dia = DIAS[Number(diaSemana)] ?? `dia ${diaSemana}`;
  const horaFmt = String(hora).padStart(2, "0");
  const minFmt = String(min).padStart(2, "0");
  return `${dia}, ${horaFmt}h${minFmt}`;
}
