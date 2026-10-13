// Grava o portfólio na versão de celular, trecho por trecho: cada trecho dura o tempo da fala dele (roteiro.json)
// e rola de uma seção até a próxima. A cada quadro as animações presas à rolagem terminam de alcançar a posição,
// então a armadura aparece se montando inteira mesmo com a gravação quadro a quadro.
const { createRequire } = require("module");
const fs = require("fs"), path = require("path");
const pp = createRequire("C:/Users/Admin/Desktop/GitHub/meu humanoide/package.json")("puppeteer-core");
const FPS = 30;
const roteiro = JSON.parse(fs.readFileSync(path.join(__dirname, "roteiro.json"), "utf8"));
const pasta = path.join(__dirname, "quadros"); fs.mkdirSync(pasta, { recursive: true });
for (const f of fs.readdirSync(pasta)) fs.unlinkSync(path.join(pasta, f));
const suave = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
(async () => {
  const b = await pp.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars", "--enable-gpu", "--ignore-gpu-blocklist"] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem("abertura-vista", "1"); } catch (e) {} });
  await p.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 3000));
  const pos = await p.evaluate(() => {
    const y = (s) => { const el = document.querySelector(s); const c = el.closest(".pin-spacer") || el; return Math.round(c.getBoundingClientRect().top + scrollY); };
    const fim = document.documentElement.scrollHeight - innerHeight;
    return { hero: y(".hero"), projetos: y("#projetos"), efeitos: y("#efeitos"), jarvis: y("#jarvis"), processo: y("#como-funciona"), contato: y("#contato"), fim };
  });
  // onde cada trecho começa e termina na página
  // cada trecho termina com a próxima seção só começando a aparecer (meia tela antes), para a legenda bater com o que está na tela
  const meia = 420;
  const faixas = {
    hero: [0, pos.hero - 120],
    servicos: [pos.hero - 120, pos.projetos - meia],
    projetos: [pos.projetos - meia, pos.efeitos - 260],
    efeitos: [pos.efeitos - 260, pos.jarvis - meia],
    jarvis: [pos.jarvis - meia, pos.processo - 300],
    processo: [pos.processo - 300, pos.contato - meia],
    contato: [pos.contato - meia, pos.fim],
  };
  let k = 0;
  for (const t of roteiro.trechos) {
    const faixa = faixas[t.id]; if (!faixa) continue;
    const n = Math.round(t.segundos * FPS);
    for (let i = 0; i < n; i++) {
      const y = Math.round(faixa[0] + (faixa[1] - faixa[0]) * suave(i / (n - 1)));
      await p.evaluate((y) => {
        window.lenis.scrollTo(y, { immediate: true, force: true });
        ScrollTrigger.update();
        ScrollTrigger.getAll().forEach((s) => { const tw = s.getTween && s.getTween(); if (tw) tw.progress(1); });
      }, y);
      await new Promise((r) => setTimeout(r, 45));
      await p.screenshot({ path: path.join(pasta, `q${String(k++).padStart(4, "0")}.jpg`), type: "jpeg", quality: 85 });
    }
  }
  fs.writeFileSync(path.join(__dirname, "posicoes.json"), JSON.stringify({ pos, quadros: k }, null, 2));
  console.log("quadros", k, JSON.stringify(pos));
  await b.close();
})();
