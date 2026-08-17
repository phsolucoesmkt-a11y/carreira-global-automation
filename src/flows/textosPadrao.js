// Conteúdo padrão de cada fluxo (o que roda se ninguém editou nada pela
// interface ainda). Fica num arquivo só pra tanto os fluxos quanto a API
// de edição usarem a mesma fonte.

export const TEXTOS_PADRAO = {
  "seja-bem-vindo": {
    videoUrl: "https://drive.google.com/uc?export=download&id=11oHu74YDN9wWs8OfEhliX13Frxl2YHL4",
    texto:
      "Galera, o grande dia está chegando! 🔥\n\n" +
      "A Nina acabou de mandar esse vídeo aqui embaixo com um recado fundamental para quem quer conquistar o mundo. " +
      "Nosso Workshop Vagas Internacionais acontece agora, nesta quinta-feira, às 20h!\n\n" +
      "Se você quer entender o caminho para trabalhar fora ou ganhar em dólar/euro sem sair de casa, não pode perder por nada.\n\n" +
      "Dá o play no vídeo e responde aqui embaixo na enquete: como está o nível de ansiedade para quinta-feira? 👇",
    enquetePergunta: "Como está a expectativa para o Workshop Vagas Internacionais? 🚀",
    enqueteOpcoes: [
      "Contando os minutos! 🤩",
      "Ansioso(a) para começar! ✈️",
      "Vou estar lá com certeza! ✍️",
      "Quero saber tudo sobre as vagas!",
    ],
  },

  "e-amanha": {
    prefixoNome: "🚨🚨📣 É AMANHÃ -  20hrs",
    pergunta: "Pra trabalhar pra uma empresa americana, você precisa se mudar pra lá?",
    enquetePergunta: "Responde aí! Mais tarde eu trago a resposta com dados 👇",
    enqueteOpcoes: [
      "🟢 Sim, com certeza",
      "🟡 Pode, mas não precisa",
      "🔴 Dá pra trabalhar da minha casa pra uma empresa americana",
    ],
  },

  "audio-nina": {
    avisoTexto: "Pessoal, olha o audio que a Nina enviou.👇🏻",
  },

  "2-horas": {
    prefixoNome: "🚨🚨📣 FALTA 2 HORAS-  20hrs",
    mensagem:
      "⏳ CONTAGEM REGRESSIVA: 2 HORAS!\n\n" +
      "O grande momento está chegando. Em apenas 120 minutos, a Nina vai abrir a caixa preta do mercado internacional " +
      "e você não quer ser a pessoa que chegou no meio da explicação, certo?\n\n" +
      "Dica de ouro: Use esse tempo para organizar seu espaço, pegar um café (ou água 💧) e já deixar o bloco de notas aberto. " +
      "O que vai ser revelado hoje vale ouro para a sua carreira.\n\n" +
      "Às 20h, o nosso encontro é oficial.\n\n" +
      "👇 CLIQUE NO LINK E ATIVE O SININHO:\n{{link}}",
  },

  "1-hora": {
    prefixoNome: "🚨🚨📣 FALTA 1 HORA-  20hrs",
    mensagem:
      "FALTA 1 HORA PARA O COMEÇO!🕒\n\n" +
      "Já pode ir desligando as distrações e avisando a família. Às 20h, o jogo vira. A Nina está nos últimos preparativos " +
      "aqui nos bastidores para mostrar como você pode conquistar sua vaga no mercado internacional.\n\n" +
      "O link é este aqui, já entra para garantir que sua conexão está ok:\n\n" +
      "👇 LINK DA AULA:\n{{link}}",
  },

  "10-minutos": {
    prefixoNome: "🚨🚨📣 FALTAM 10 MINUTOS-  20hrs",
    mensagem:
      "PORTAS ABERTAS: FALTAM 10 MINUTOS!🚨\n\n" +
      "Acabamos de liberar o acesso! A Nina já vai entrar ao vivo em instantes para o nosso Webinário Vagas Internacionais.\n\n" +
      "Não deixa para entrar às 20h01, porque o conteúdo já começa com o pé no acelerador e você não quer perder a introdução estratégica.\n\n" +
      "CLIQUE NO LINK ABAIXO E ENTRE AGORA:\n👉 {{link}}\n\n" +
      "Bora conquistar esse mundo! 🌍🚀",
  },

  "e-hoje": {
    prefixoNome: "🚨🚨📣 É HOJE -  20hrs",
    videoUrl: "https://drive.google.com/uc?export=download&id=1d4tfEw0hoKJ0GMfJ7aWXp8N9ufDyE54Z",
    texto:
      "MULTIPLICAR O SALÁRIO FAZENDO O MESMO TRABALHO?💸\n\n" +
      "Pode parecer loucura, mas é pura matemática. Enquanto você trabalha em Real, tem gente usando o mesmo tempo para ganhar em Dólar e Euro.\n\n" +
      "A Nina mandou esse vídeo aqui cima mostrando casos reais de alunos que pararam de aceitar o '1 por 1' e multiplicaram o salário apenas mudando o mercado de atuação.\n\n" +
      "O mesmo trabalho, a mesma vaga, no mercado internacional paga muito mais. E você ainda trabalha de casa.\n\n" +
      "É HOJE, ÀS 20H! O Webinário Vagas Internacionais vai te mostrar como virar esse jogo.\n\n" +
      "Assista ao vídeo e veja o que te espera!😉",
  },

  "14h": {
    mensagem:
      "Hoje no workshop a gente vai cobrir tudo que ninguém te contou sobre trabalhar pra empresa americana de casa:\n\n" +
      "📌 Como o mercado de trabalho global funciona na prática\n\n" +
      "💰 Onde estão as vagas e quanto pagam\n\n" +
      "🔄 Se você precisa (ou não) mudar de área pra entrar\n\n" +
      "🔗 Como aparecer pra recrutadores internacionais\n\n" +
      "🗣️ Qual nível de inglês é necessário de verdade\n\n" +
      "🎯 Como é o processo seletivo e a entrevista lá fora\n\n" +
      "📣 Como posicionar sua experiência brasileira pra esse mercado\n\n" +
      "🎂 Se a idade é ou não um fator eliminatório\n\n" +
      "🌐 Onde encontrar as vagas remotas\n\n" +
      "💳 Como receber em dólar/euro e declarar tudo certinho\n\n" +
      "Hoje às 20h, ao vivo. Sem gravação.",
  },

  "17h": {
    mensagem:
      "Tá chegando, pessoal.\n\n" +
      "20hs começa nosso workshop vagas internacionais!\n\n" +
      "O conteúdo tá incrível. Se você quer realmente entender como você pode conseguir sua vaga no mercado global, trabalhando de casa e ganhando em dólar, você não pode perder esse workshop por nada!\n\n" +
      "Nos vemos às 20hs! 🚀",
  },

  "durante-live-20h10": {
    mensagem:
      "🔍 Cadê você que ainda não entrou?\n\n" +
      "Nina tá abrindo AGORA, ao vivo, o mapa dos 3 mercados. Brasil, Europa e EUA. E tá mostrando por que o mesmo profissional que tira R$15k aqui fatura 3x lá fora.\n\n" +
      "Quem tá dentro já tá vendo a fresta exata pra fazer a transição. Você tá ficando de fora dessa parte.\n\n" +
      "Toca o link e entra 👇\n🔗 {{link}}",
  },
  "durante-live-20h20": {
    mensagem:
      "🚨 Tá perdendo o caso mais quente da live\n\n" +
      "Nina tá contando AGORA a história do Paulo, Engenheiro Sênior travado em R$18.000/mês, que virou a chave pra R$30.020.\n\n" +
      "O passo a passo tá aberto na tela. Quem não entrou agora não vai ver isso de novo.\n\n" +
      "Ainda dá tempo de pegar do começo do caso 👇\n🔗 {{link}}",
  },
  "durante-live-20h30": {
    mensagem:
      "⏰ Só falta você nessa sala\n\n" +
      "Nina tá listando AO VIVO os cargos com a maior velocidade de transição pro mercado internacional.\n\n" +
      "Quem tá dentro já tá descobrindo se a profissão dele tá na lista, ou qual o atalho se não estiver.\n\n" +
      "Você não pode ficar de fora dessa parte. Entra agora 👇\n🔗 {{link}}",
  },
  "durante-live-20h40": {
    mensagem:
      "👀 Tá fora? Você tá perdendo a parte prática\n\n" +
      "Nina tá mostrando AGORA, clique a clique, o ajuste no LinkedIn que faz recrutador internacional vir ATÉ você. Sem precisar mandar currículo pra ninguém.\n\n" +
      "É a parte que ninguém ensina de graça.\n\n" +
      "Entra antes que ela vire a página 👇\n🔗 {{link}}",
  },
  "durante-live-20h50": {
    mensagem:
      "🔥 Reta final. Vai mesmo deixar passar?\n\n" +
      "Nina tá fechando AGORA a live com a estrutura de narrativa profissional que faz recrutador bater o olho no seu perfil e enxergar TODO o seu potencial em segundos.\n\n" +
      "Quem assistiu até aqui já sai com isso pronto. Quem não entrou, perdeu.\n\n" +
      "Pega os minutos finais antes de encerrar 👇\n🔗 {{link}}",
  },
  "durante-live-carrinho-aberto": {
    mensagem:
      "🔥 O LINK ESTÁ ABERTO!\n\n" +
      "A Nina acabou de liberar as vagas pro Carreira Global.\n\n" +
      "Se você assistiu até aqui, você já sabe: existe um caminho real pra sair do salário em real e começar a ganhar em dólar, trabalhando remoto na sua área.\n\n" +
      "Agora é a hora de agir.\n\n👉 carreiraglobal.net\n\n" +
      "As vagas são limitadas e esse valor é exclusivo pra quem está no workshop AGORA.\n\n" +
      "Não fecha essa tela sem clicar no link. Depois não tem como garantir essas condições.\n\n👉 carreiraglobal.net",
  },
  "durante-live-garantindo-vaga": {
    mensagem:
      "Já tem gente garantindo vaga! 👀\n\n" +
      "Se você ainda tá em dúvida, lembra: o valor que tá na tela agora é EXCLUSIVO pro workshop. Amanhã volta ao preço normal.\n\n" +
      "Seu link tá aqui:\n\n👉 carreiraglobal.net\n\n" +
      "Não deixa pra depois. Quem tá entrando agora tá saindo na frente.",
  },

  "23h-fim-do-dia": {
    mensagem:
      "Última mensagem desse grupo.\n\n\n" +
      "O link fecha meia noite e esse grupo vai ser encerrado.\n\n\n" +
      "Se você quer continuar fazendo o que sempre fez, tudo bem. Eu respeito.\n\n" +
      "Mas se você quer um caminho diferente — o link tá aqui:\n\n\n" +
      "👉 carreiraglobal.net\n\n\n" +
      "Obrigada por estar aqui essa com a gente. De verdade.",
  },

  "estamos-ao-vivo": {
    prefixoNome: "🚨🚨📣 ESTAMOS AO VIVO",
    mensagem:
      "ESTAMOS AO VIVO: O CAMINHO COMEÇA AQUI!🔥\n\n" +
      "A Nina já entrou e a aula sobre Vagas Internacionais acabou de começar. Se você quer entender como o mercado global " +
      "funciona e como se posicionar nele, a hora é agora.\n\n" +
      "Não deixe para depois, essa é a oportunidade de mudar sua carreira em 2026.\n\n" +
      "👇 CLIQUE NO LINK ABAIXO E ENTRE AGORA:\n{{link}}\n\n" +
      "Corre, que o conteúdo já está rolando!",
  },
};
