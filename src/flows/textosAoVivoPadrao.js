// Conteúdo padrão da trilha "Ao Vivo" — espelha exatamente os fluxos reais
// e ativos do n8n (confirmados via API em 2026-08-25), com o link do
// YouTube no lugar do WebinarJam antigo. Nenhum fluxo do n8n foi alterado.

export const TEXTOS_AO_VIVO_PADRAO = {
  "aovivo-seja-bem-vindo": {
    videoUrl: "https://drive.google.com/uc?export=download&id=1O0qQsHXB_0mPEwD_BFfgQxjhACPKqR3C",
    texto:
      "Galera, o grande dia está chegando! 🔥\n\n" +
      "A Nina acabou de mandar esse vídeo aqui embaixo com um recado fundamental para quem quer conquistar o mundo. " +
      "Nosso Workshop Vagas Internacionais acontece agora, nesta quarta-feira, às 20h!\n\n" +
      "Se você quer entender o caminho para trabalhar fora ou ganhar em dólar/euro sem sair de casa, não pode perder por nada.\n\n" +
      "Dá o play no vídeo e responde aqui embaixo na enquete: como está o nível de ansiedade para quarta-feira? 👇",
    enquetePergunta: "Como está a expectativa para o Workshop Vagas Internacionais? 🚀",
    enqueteOpcoes: [
      "Contando os minutos! 🤩",
      "Ansioso(a) para começar! ✈️",
      "Vou estar lá com certeza! ✍️",
      "Quero saber tudo sobre as vagas!",
    ],
  },

  "aovivo-e-amanha": {
    prefixoNome: "🚨🚨📣 É AMANHÃ -  20hrs",
    pergunta: "Pra trabalhar pra uma empresa americana, você precisa se mudar pra lá?",
    enquetePergunta: "Responde aí! Mais tarde eu trago a resposta com dados 👇",
    enqueteOpcoes: [
      "🟢 Sim, com certeza",
      "🟡 Pode, mas não precisa",
      "🔴 Dá pra trabalhar da minha casa pra uma empresa americana",
    ],
  },

  "aovivo-audio-nina": {
    avisoTexto: "Pessoal, olha o audio que a Nina enviou.👇🏻",
  },

  "aovivo-aviso-extensao": {
    mensagem:
      "Bom dia! Passando aqui pra avisar uma coisa que não tava nos planos.\n\n" +
      "Ontem o workshop lotou. Foi muito maior do que a gente esperava e ficamos muito felizes com isso. Só que por conta disso muita gente teve problema pra acessar, e o suporte amanheceu cheio de mensagem de gente pedindo pra reabrir.\n\n" +
      "Conversei com a Nina e ela topou manter as condições do workshop abertas por mais um dia pra essas pessoas.\n\n" +
      "Então se você tentou comprar ontem e não conseguiu, ou se assistiu e ficou na dúvida e hoje acordou querendo, tá aberto até meia-noite de hoje. Depois disso fecha e não volta.\n\n" +
      "Workshop: {{link}}\nCarreira Global: carreiraglobal.net",
  },

  "aovivo-conta-rapida": {
    mensagem:
      "Deixa eu te fazer uma conta rápida.\n\n" +
      "Se você continua ganhando em real o que ganha hoje, daqui a 12 meses vai ter ganho exatamente a mesma coisa.\n\n" +
      "Talvez um reajuste de 5%, 6% que a inflação come antes de chegar na sua conta.\n\n" +
      "Agora pensa no cenário oposto: daqui a 4 meses você já pode estar posicionado pra vagas internacionais remotas, ganhando em dólar. Quanto vale essa diferença em 1 ano?\n\n" +
      "O treinamento custa menos que uma parcela de celular.\n\n" +
      "A parcela custa menos que uma pizza.\n\n" +
      "As condições do workshop fecham hoje à meia-noite:\ncarreiraglobal.net",
  },

  "aovivo-ultima-mensagem": {
    mensagem:
      "Última mensagem, pessoal.\n\n" +
      "O link fecha hoje à meia-noite. \nDepois disso fecha e volta pro preço normal, sem os bônus do workshop.\n\n" +
      "Aula do workshop: {{link}}\nCarreira Global: carreiraglobal.net\n\n" +
      "Foi um prazer ter vocês conosco essa semana.",
  },

  "aovivo-grupo-encerrado": {
    prefixoNome: "Grupo encerrado | Workshop Vagas Internacionais",
  },

  "aovivo-e-hoje": {
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

  "aovivo-2-horas": {
    prefixoNome: "🚨🚨📣 FALTA 2 HORAS-  20hrs",
    mensagem:
      "⏳ CONTAGEM REGRESSIVA: 2 HORAS!\n\n" +
      "O grande momento está chegando. Em apenas 120 minutos, a Nina vai abrir a caixa preta do mercado internacional e você não quer ser a pessoa que chegou no meio da explicação, certo?\n\n" +
      "Dica de ouro: Use esse tempo para organizar seu espaço, pegar um café (ou água 💧) e já deixar o bloco de notas aberto. O que vai ser revelado hoje vale ouro para a sua carreira.\n\n" +
      "Às 20h, o nosso encontro é oficial.",
  },

  "aovivo-1-hora": {
    prefixoNome: "🚨🚨📣 FALTA 1 HORA-  20hrs",
    mensagem:
      "FALTA 1 HORA PARA O COMEÇO!🕒\n\n" +
      "Já pode ir desligando as distrações e avisando a família. Às 20h, o jogo vira. A Nina está nos últimos preparativos aqui nos bastidores para mostrar como você pode conquistar sua vaga no mercado internacional.\n\n" +
      "O link é este aqui, já entra para garantir que sua conexão está ok:\n\n" +
      "👇 LINK DA AULA:\n{{link}}",
  },

  "aovivo-10-minutos": {
    prefixoNome: "🚨🚨📣 FALTAM 10 MINUTOS-  20hrs",
    mensagem:
      "PORTAS ABERTAS: FALTAM 10 MINUTOS!🚨\n\n" +
      "Acabamos de liberar o acesso! A Nina já vai entrar ao vivo em instantes para o nosso Webinário Vagas Internacionais.\n\n" +
      "Não deixa para entrar às 20h01, porque o conteúdo já começa com o pé no acelerador e você não quer perder a introdução estratégica.\n\n" +
      "CLIQUE NO LINK ABAIXO E ENTRE AGORA:\n👉 {{link}}\n\n" +
      "Bora conquistar esse mundo! 🌍🚀",
  },

  "aovivo-estamos-ao-vivo": {
    prefixoNome: "🚨🚨📣 ESTAMOS AO VIVO",
    mensagem:
      "ESTAMOS AO VIVO: O CAMINHO COMEÇA AQUI!🔥\n\n" +
      "A Nina já entrou e a aula sobre Vagas Internacionais acabou de começar. Se você quer entender como o mercado global " +
      "funciona e como se posicionar nele, a hora é agora.\n\n" +
      "Não deixe para depois, essa é a oportunidade de mudar sua carreira em 2026.\n\n" +
      "👇 CLIQUE NO LINK ABAIXO E ENTRE AGORA:\n{{link}}\n\n" +
      "Corre, que o conteúdo já está rolando!",
  },

  "aovivo-durante-live-20h10": {
    mensagem:
      "🔍 Cadê você que ainda não entrou?\n\n" +
      "Nina tá abrindo AGORA, ao vivo, o mapa dos 3 mercados. Brasil, Europa e EUA. E tá mostrando por que o mesmo profissional que tira R$15k aqui fatura 3x lá fora.\n\n" +
      "Quem tá dentro já tá vendo a fresta exata pra fazer a transição. Você tá ficando de fora dessa parte.\n\n" +
      "Toca o link e entra 👇\n🔗 {{link}}",
  },
  "aovivo-durante-live-20h20": {
    mensagem:
      "🚨 Tá perdendo o caso mais quente da live\n\n" +
      "Nina tá contando AGORA a história do Paulo, Engenheiro Sênior travado em R$18.000/mês, que virou a chave pra R$30.020.\n\n" +
      "O passo a passo tá aberto na tela. Quem não entrou agora não vai ver isso de novo.\n\n" +
      "Ainda dá tempo de pegar do começo do caso 👇\n🔗 {{link}}",
  },
  "aovivo-durante-live-20h30": {
    mensagem:
      "⏰ Só falta você nessa sala\n\n" +
      "Nina tá listando AO VIVO os cargos com a maior velocidade de transição pro mercado internacional.\n\n" +
      "Quem tá dentro já tá descobrindo se a profissão dele tá na lista, ou qual o atalho se não estiver.\n\n" +
      "Você não pode ficar de fora dessa parte. Entra agora 👇\n🔗 {{link}}",
  },
  "aovivo-durante-live-20h40": {
    mensagem:
      "👀 Tá fora? Você tá perdendo a parte prática\n\n" +
      "Nina tá mostrando AGORA, clique a clique, o ajuste no LinkedIn que faz recrutador internacional vir ATÉ você. Sem precisar mandar currículo pra ninguém.\n\n" +
      "É a parte que ninguém ensina de graça.\n\n" +
      "Entra antes que ela vire a página 👇\n🔗 {{link}}",
  },
  "aovivo-durante-live-20h50": {
    mensagem:
      "🔥 Reta final. Vai mesmo deixar passar?\n\n" +
      "Nina tá fechando AGORA a live com a estrutura de narrativa profissional que faz recrutador bater o olho no seu perfil e enxergar TODO o seu potencial em segundos.\n\n" +
      "Quem assistiu até aqui já sai com isso pronto. Quem não entrou, perdeu.\n\n" +
      "Pega os minutos finais antes de encerrar 👇\n🔗 {{link}}",
  },

  "aovivo-fim-do-dia": {
    mensagem:
      "Última mensagem desse grupo.\n\n\n" +
      "O link fecha meia noite e esse grupo vai ser encerrado.\n\n\n" +
      "Se você quer continuar fazendo o que sempre fez, tudo bem. Eu respeito.\n\n" +
      "Mas se você quer um caminho diferente — o link tá aqui:\n\n\n" +
      "👉 carreiraglobal.net\n\n\n" +
      "Obrigada por estar aqui essa com a gente. De verdade.",
  },
};
