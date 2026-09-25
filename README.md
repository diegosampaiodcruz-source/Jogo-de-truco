# Truco Brasileiro

Um jogo de truco 2x2 em HTML5, CSS3 e JavaScript puro, pronto para abrir localmente e publicar no GitHub Pages.

## Como executar

1. Baixe ou clone este repositório.
2. Abra a pasta do projeto.
3. Abra o arquivo `index.html` no navegador.
4. O jogo começa imediatamente.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie os arquivos do projeto para o repositório.
3. Acesse `Settings` → `Pages`.
4. Em `Build and deployment`, escolha a branch principal (`main`) e a pasta `/root`.
5. Salve e aguarde a publicação.
6. O link aparecerá na aba `Pages`.

## Estrutura do projeto

- `index.html` — estrutura da mesa e layout da interface
- `style.css` — visual do jogo e responsividade
- `script.js` — lógica do truco, IA, placar e interações
- `assets/` — pasta preparada para imagens, sons e recursos visuais

## Personalização

- Para trocar os sons, substitua os arquivos da pasta `assets/`.
- Para ajustar a dificuldade da IA, edite a função `chooseAiCard()` em `script.js`.
- Para alterar a aparência da mesa, modifique os estilos em `style.css`.

## Observações

- O jogo usa JavaScript puro e não depende de frameworks.
- A música e os efeitos são gerados via Web Audio para funcionar sem dependências externas.
- A estrutura foi criada para funcionar em computadores, tablets e celulares.
