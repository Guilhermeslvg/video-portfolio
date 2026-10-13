# Vídeo do portfólio

Vídeo de apresentação do [portfólio do Guilherme](https://guilhermeslvg.github.io/guilherme-site/), feito com Remotion.

- Vídeo pronto: [saida/portfolio-guilherme.mp4](saida/portfolio-guilherme.mp4) (1920x1080, 19 s)
- A gravação do site fica em `public/portfolio.mp4`; a composição está em `src/Composition.tsx` (abertura com o nome, o site rolando numa janela de navegador com legendas e o final com o link).

Para gerar de novo:

```
npm install
npx remotion render src/index.ts Portfolio saida/portfolio-guilherme.mp4
```
