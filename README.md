# Beat Lab

Um sequenciador de batidas que roda no navegador. Você monta o ritmo ligando os passos de uma grade, aperta play e ouve na hora. Os sons são criados pelo próprio código, sem nenhum arquivo de áudio.

## Sobre o projeto

Eu gosto de música, de eletrônica a rap, passando por vários outros gêneros que têm batida. Então resolvi juntar o útil ao agradável: usar o que estou aprendendo de programação pra construir algo ligado ao que eu curto, e ver no que dava.

Me baseei de leve no FL Studio, principalmente na ideia da grade de passos, com um instrumento por linha e os botões agrupados de quatro em quatro pra ajudar a contar o compasso. O visual é outra coisa: puxei pra uma máquina de ritmo de estúdio, com corpo cinza, botões de relevo e LEDs.

Este é um projeto independente, sem ligação com o FL Studio nem com a empresa que o faz.

## Como usar

1. Clique em **Tocar**. A batida de exemplo começa
2. Clique nos botões da grade pra ligar e desligar passos. O LED aceso no topo do botão mostra que ele está ativo
3. Mexa no **andamento** pra deixar a batida mais lenta ou mais rápida
4. Clique no **nome de um instrumento** pra ouvir o som dele sozinho
5. Use **Mudo** pra silenciar uma linha sem apagar o que você montou
6. Quando quiser recomeçar, use **Limpar**. Se quiser a batida de exemplo de volta, **Padrão inicial**

A barra de espaço também toca e para. A sua batida fica salva no navegador, então ela continua lá quando você volta.

Pra brincar: perto de 90 BPM, a batida já tem cara de rap. Perto de 120, vira música de pista.

## O que tem aqui

- 16 passos e 6 instrumentos: bumbo, caixa, palma, chimbal fechado, chimbal aberto e tom
- Andamento de 60 a 200 BPM, que dá pra mudar com a batida tocando
- Uma fileira de LEDs e o destaque na coluna que está tocando, pra você ver onde a batida está
- No celular, os 16 passos viram duas linhas de 8, pra caber na tela
- Navegação por teclado e foco visível nos botões

## Rodando no seu computador

1. Baixe ou clone este repositório
2. Abra a pasta no VS Code
3. Instale a extensão **Live Server**
4. Clique com o botão direito no `index.html` e escolha **Open with Live Server**

Precisa de internet só pra carregar as fontes. O som funciona sem ela. Se não sair áudio logo de cara, é normal: o navegador só libera o som depois que você clica em alguma coisa na página.

## Como os arquivos estão organizados

```
beat-lab/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    └── script.js
```

O `index.html` monta a máquina, o `style.css` cuida do visual (relevo, LEDs, cores) e o `script.js` tem os sons, o relógio da batida e os botões.

## O que tem por baixo

**Os sons são feitos no código.** Eu usei o Web Audio API pra criar cada instrumento do zero. O bumbo, por exemplo, é um tom grave que cai rápido de frequência, e a caixa e os chimbais usam ruído filtrado. Por isso o projeto não tem nenhum arquivo de áudio.

**O tempo da batida precisa ser firme.** O `setInterval` do JavaScript não é preciso o bastante pra música, e a batida ficaria bamba. Então o código só agenda as notas dos próximos instantes, e quem marca a hora exata de cada som é o relógio do próprio áudio.

## O que eu usei

- HTML, CSS e JavaScript puro, sem framework nem biblioteca
- Web Audio API pra gerar os sons e controlar o tempo
- Fontes Barlow Condensed e DM Mono, do Google Fonts

## O que ainda não está perfeito

- Os sons são simples. Servem pra brincar, mas não substituem um kit de bateria de verdade
- Só existe um padrão por vez, e não dá pra ajustar o volume de cada instrumento
- Não tem como exportar o que você criou em áudio
- Foi pensado pra navegadores atuais

## O que quero fazer depois

- Mais instrumentos
- Volume de cada linha
- Balanço (swing), pra deixar a batida menos "quadrada"
- Vários padrões salvos
- Compartilhar uma batida por link
- Exportar a batida em áudio

## Quem fez

Sou o Félix, designer UI/UX e ilustrador, aqui do Recife.

- GitHub: [WendellFeliix](https://github.com/WendellFeliix)
- Portfólio: https://sites.google.com/view/wendellfelixportifolio/home
