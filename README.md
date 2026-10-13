# Vídeo do portfólio

Vídeo de apresentação do [portfólio do Guilherme](https://guilhermeslvg.github.io/guilherme-site/), feito com Remotion.

- Vídeo pronto: [saida/portfolio-guilherme.mp4](saida/portfolio-guilherme.mp4) (1920x1080, 19 s)
- A gravação do site fica em `public/portfolio.mp4`; a composição está em `src/Composition.tsx` (abertura com o nome, o site rolando numa janela de navegador com legendas e o final com o link).

Versões para Instagram, com narração (voz Daniel do Windows) e legenda por seção:
- Story 1080x1920: [saida/portfolio-story.mp4](saida/portfolio-story.mp4)
- Feed 1080x1350: [saida/portfolio-feed.mp4](saida/portfolio-feed.mp4)

O roteiro (texto de cada fala e quanto tempo dura cada seção) fica em `narracao/roteiro.json` e `narracao/falas.json`.
Para refazer as falas: `powershell narracao/gerar-voz.ps1`; para regravar o site no celular: `node narracao/gravar-celular.cjs`.

Para gerar de novo:

```
npm install
npx remotion render src/index.ts Portfolio saida/portfolio-guilherme.mp4
npx remotion render src/index.ts Story saida/portfolio-story.mp4
npx remotion render src/index.ts Feed saida/portfolio-feed.mp4
```
