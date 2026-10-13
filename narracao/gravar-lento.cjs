// Grava o portfólio no celular em ritmo calmo: rola até cada parte importante, para um pouco e segue.
// Salva os quadros em public/tela/ e os momentos em que cada seção aparece em src/marcos.json (usado na Tipografia).
const { createRequire } = require("module");
const fs = require("fs"), path = require("path");
const pp = createRequire("C:/Users/Admin/Desktop/GitHub/meu humanoide/package.json")("puppeteer-core");
const FPS = 30;
const pasta = path.join(__dirname, "..", "public", "tela");
fs.mkdirSync(pasta, { recursive: true });
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
    const centro = (s) => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); return Math.round(r.top + scrollY + r.height / 2 - innerHeight / 2); };
    return { hero: y(".hero"), painel: centro(".hero .painel"), faixa: y(".faixa-servicos"), projetos: y("#projetos"), efeitos: y("#efeitos"), jarvis: y("#jarvis"),
      processo: y("#como-funciona"), contato: y("#contato"), fim: document.documentElement.scrollHeight - innerHeight };
  });
  // roteiro: [nome, até onde rola, segundos rolando, segundos parado]
  const roteiro = [
    ["abertura", pos.hero - 120, 4.5, 0.6],
    ["painel", pos.painel, 1.5, 1.1],
    ["servicos", pos.projetos - 420, 2.0, 0.9],
    ["projetos", pos.projetos + 60, 1.3, 1.3],
    ["efeitos", pos.jarvis - 420, 4.2, 0.5],
    ["jarvis", pos.contato - 420, 2.8, 0.5],
    ["contato", pos.fim, 1.9, 1.2],
  ];
  const marcos = {}; let k = 0, y0 = 0;
  const quadro = async (y) => {
    await p.evaluate((y) => {
      window.lenis.scrollTo(y, { immediate: true, force: true });
      ScrollTrigger.update();
      ScrollTrigger.getAll().forEach((s) => { const tw = s.getTween && s.getTween(); if (tw) tw.progress(1); });
    }, y);
    await new Promise((r) => setTimeout(r, 45));
    await p.screenshot({ path: path.join(pasta, `q${String(k++).padStart(4, "0")}.jpg`), type: "jpeg", quality: 88 });
  };
  for (const [nome, alvo, rola, para] of roteiro) {
    marcos[nome] = +(k / FPS).toFixed(2);
    const n = Math.round(rola * FPS);
    for (let i = 1; i <= n; i++) await quadro(Math.round(y0 + (alvo - y0) * suave(i / n)));
    for (let i = 0; i < Math.round(para * FPS); i++) await quadro(alvo);
    y0 = alvo;
  }
  marcos.fim = +(k / FPS).toFixed(2); marcos.quadros = k;
  fs.writeFileSync(path.join(__dirname, "..", "src", "marcos.json"), JSON.stringify(marcos, null, 2));
  console.log(JSON.stringify(marcos));
  await b.close();
})();
