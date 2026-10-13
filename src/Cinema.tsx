// Vídeo no estilo "mockup 3D cinematográfico", em um plano só: a câmera anda sem cortes em volta de um celular preto
// com espessura de verdade, deitado numa mesa escura de ripas, com blocos, traços de luz e partículas em volta.
// O site roda na tela do começo ao fim. Sem legenda e sem voz; no final a câmera recua e o nome aparece.
import React from "react";
import {
  AbsoluteFill,
  Composition,
  OffthreadVideo,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as carregarOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: OUTFIT } = carregarOutfit("normal", { weights: ["500", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = carregarMono("normal", { weights: ["500"], subsets: ["latin"] });

const FPS = 30;
const DURACAO = 33; // segundos
const TOTAL = DURACAO * FPS;
const COR = { ciano: "#2cd3f2", bebe: "#d4eaff", claro: "#4c9be8", azul: "#1d5fd0" };

// caminho da câmera: pontos-chave em segundos; entre eles a câmera passa em curva suave (Catmull-Rom), sem parar nem cortar.
// rx = inclinação da mesa, rz = giro no plano da mesa, ry = giro lateral, s = zoom, x/y = deslocamento em px (na escala da tela 1080 de largura)
type Cam = { t: number; rx: number; ry: number; rz: number; s: number; x: number; y: number };
const CAMINHO: Cam[] = [
  { t: 0, rx: 62, ry: 0, rz: -38, s: 0.82, x: 0, y: 40 },
  { t: 3.5, rx: 55, ry: 0, rz: -26, s: 1.12, x: 0, y: -40 },
  { t: 7, rx: 42, ry: -8, rz: -8, s: 2.0, x: -40, y: 420 },
  { t: 10.5, rx: 26, ry: -16, rz: 4, s: 1.35, x: 0, y: 120 },
  { t: 14, rx: 48, ry: 0, rz: 22, s: 1.55, x: 60, y: 60 },
  { t: 17.5, rx: 36, ry: 10, rz: 10, s: 2.2, x: 20, y: 260 },
  { t: 21, rx: 20, ry: 18, rz: -4, s: 1.3, x: 0, y: 0 },
  { t: 24.5, rx: 52, ry: 0, rz: -20, s: 1.8, x: -40, y: -180 },
  { t: 28, rx: 58, ry: 0, rz: -34, s: 1.15, x: 0, y: -60 },
  { t: 33, rx: 64, ry: 0, rz: -44, s: 0.72, x: 0, y: 120 },
];
const CHAVES: (keyof Omit<Cam, "t">)[] = ["rx", "ry", "rz", "s", "x", "y"];
function camera(seg: number): Omit<Cam, "t"> {
  const P = CAMINHO;
  let i = 0; while (i < P.length - 2 && seg > P[i + 1].t) i++;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
  const u = Math.min(1, Math.max(0, (seg - p1.t) / (p2.t - p1.t)));
  const u2 = u * u, u3 = u2 * u;
  const out = {} as Omit<Cam, "t">;
  for (const k of CHAVES) out[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3);
  return out;
}

// o celular com espessura: a frente (tela) e várias camadas atrás formando a lateral de metal
const ALT = 1180, LARG = Math.round(ALT * (780 / 1688)), BORDA = 22, RAIO = ALT * 0.09, CAMADAS = 14, ESP = 2.2;
const Celular: React.FC<{ brilho: number }> = ({ brilho }) => {
  const W = LARG + BORDA * 2, H = ALT + BORDA * 2;
  return (
    <div style={{ position: "absolute", left: -W / 2, top: -H / 2, width: W, height: H, transformStyle: "preserve-3d" }}>
      {/* lateral: camadas empilhadas, mais claras nas pontas como metal escovado */}
      {Array.from({ length: CAMADAS }, (_, i) => {
        const z = -(i + 1) * ESP, luz = i === 0 || i === CAMADAS - 1 ? 0.22 : 0.1 + 0.05 * Math.sin(i);
        return <div key={i} style={{ position: "absolute", inset: 0, borderRadius: RAIO, transform: `translateZ(${z}px)`,
          background: `linear-gradient(135deg, rgba(150,165,190,${luz + 0.12}), rgba(20,24,32,1) 25%, rgba(40,46,58,1) 55%, rgba(12,14,19,1) 80%, rgba(140,155,180,${luz}))` }} />;
      })}
      {/* frente */}
      <div style={{ position: "absolute", inset: 0, padding: BORDA, borderRadius: RAIO, background: "#06070a", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.1)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: RAIO * 0.82, overflow: "hidden", background: "#000" }}>
          <OffthreadVideo src={staticFile("celular.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", top: ALT * 0.013, left: "50%", width: LARG * 0.3, height: ALT * 0.032, marginLeft: -LARG * 0.15, borderRadius: 999, background: "#000" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${brilho - 16}%, rgba(255,255,255,.14) ${brilho}%, transparent ${brilho + 16}%)` }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 50px rgba(0,0,0,.4)" }} />
        </div>
      </div>
    </div>
  );
};

// bloco escuro de ripas em cima da mesa (com altura, para dar profundidade quando a câmera passa)
const Bloco: React.FC<{ x: number; y: number; w: number; h: number; alto: number; giro: number }> = ({ x, y, w, h, alto, giro }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transformStyle: "preserve-3d", transform: `rotateZ(${giro}deg)` }}>
    {Array.from({ length: 10 }, (_, i) => (
      <div key={i} style={{ position: "absolute", inset: 0, transform: `translateZ(${(i / 9) * alto - 40}px)`, borderRadius: 6,
        background: i === 9 ? "repeating-linear-gradient(90deg, #121a2b 0 22px, #1b2538 22px 26px, #0a0f19 26px 30px)" : "#090d16" }} />
    ))}
  </div>
);

// traço de luz deitado na mesa: uma linha fina azul com um brilho correndo por ela
const Traco: React.FC<{ x: number; y: number; comp: number; giro: number; atraso: number; f: number }> = ({ x, y, comp, giro, atraso, f }) => {
  const p = ((f + atraso) % 150) / 150;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: comp, height: 4, transform: `rotateZ(${giro}deg) translateZ(-36px)`, transformOrigin: "0 50%",
      background: "rgba(76,155,232,.3)", boxShadow: "0 0 14px rgba(44,211,242,.4)" }}>
      <div style={{ position: "absolute", top: -2, left: `${p * 100}%`, width: comp * 0.22, height: 7, marginLeft: -comp * 0.11, borderRadius: 7,
        background: `linear-gradient(90deg, transparent, ${COR.ciano}, #fff, ${COR.ciano}, transparent)`, boxShadow: `0 0 24px ${COR.ciano}`, opacity: Math.sin(p * Math.PI) }} />
    </div>
  );
};

// partículas de luz em profundidades diferentes (as de longe ficam borradas)
const PARTICULAS = Array.from({ length: 34 }, (_, i) => ({
  x: (random(`x${i}`) - 0.5) * 1700, y: (random(`y${i}`) - 0.5) * 2200, z: 60 + random(`z${i}`) * 360,
  r: 4 + random(`r${i}`) * 9, v: 0.2 + random(`v${i}`) * 0.6, fase: random(`f${i}`) * 6.28,
}));

const Filme: React.FC<{ formato: "story" | "feed" }> = ({ formato }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seg = f / FPS;
  const cam = camera(seg);
  const k = width / 1080; // a câmera foi pensada para 1080 de largura
  const zoomBase = formato === "story" ? 1 : 0.78;
  const brilho = interpolate(f % 180, [0, 180], [-30, 130]);
  const final = interpolate(seg, [DURACAO - 4.2, DURACAO - 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulso = 0.75 + 0.25 * Math.sin(seg * 1.4);
  return (
    <AbsoluteFill style={{ background: "#03060d", overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1500 * k, perspectiveOrigin: "50% 46%" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, transformStyle: "preserve-3d",
          transform: `translate(${cam.x * k}px, ${cam.y * k}px) scale(${cam.s * zoomBase * k}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)` }}>
          {/* mesa de ripas, com a luz fria vinda do centro */}
          <div style={{ position: "absolute", left: -3000, top: -3800, width: 6000, height: 7600, transform: "translateZ(-40px)",
            background: "radial-gradient(28% 22% at 50% 50%, rgba(29,95,208,.32), transparent 70%), repeating-linear-gradient(90deg, #070b14 0 30px, #0f1626 30px 36px, #04070d 36px 40px)" }} />
          {/* brilho e sombra do celular na mesa */}
          <div style={{ position: "absolute", left: -LARG * 0.9, top: -ALT * 0.7, width: LARG * 1.8, height: ALT * 1.4, transform: "translateZ(-39px)", borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(44,211,242,${0.22 * pulso}), transparent)`, filter: "blur(30px)" }} />
          <div style={{ position: "absolute", left: -LARG * 0.55 + 30, top: -ALT * 0.53 + 40, width: LARG * 1.1, height: ALT * 1.06, transform: "translateZ(-38px)", borderRadius: RAIO, background: "rgba(0,0,0,.85)", filter: "blur(34px)" }} />
          {/* blocos em volta */}
          <Bloco x={-620} y={-260} w={420} h={640} alto={90} giro={8} />
          <Bloco x={640} y={360} w={460} h={760} alto={130} giro={-6} />
          <Bloco x={-560} y={860} w={380} h={420} alto={60} giro={14} />
          <Bloco x={560} y={-820} w={340} h={380} alto={170} giro={-12} />
          {/* traços de luz na mesa */}
          <Traco x={-1100} y={680} comp={1000} giro={-8} atraso={0} f={f} />
          <Traco x={340} y={-720} comp={800} giro={12} atraso={60} f={f} />
          <Traco x={-380} y={-680} comp={60} giro={90} atraso={110} f={f} />
          <Traco x={330} y={-560} comp={1100} giro={90} atraso={90} f={f} />
          <Traco x={-1500} y={-1300} comp={800} giro={20} atraso={30} f={f} />
          {/* o celular, um pouco acima da mesa */}
          <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: "translateZ(0px)" }}><Celular brilho={brilho} /></div>
          {/* partículas */}
          {PARTICULAS.map((p, i) => {
            const z = p.z + Math.sin(seg * p.v + p.fase) * 40;
            const desfoque = Math.max(0, (z - 160) / 60);
            return <div key={i} style={{ position: "absolute", left: p.x + Math.sin(seg * p.v * 0.7 + p.fase) * 60, top: p.y, width: p.r * 2, height: p.r * 2, borderRadius: "50%",
              transform: `translateZ(${z}px)`, background: i % 3 ? COR.claro : COR.ciano, boxShadow: `0 0 ${p.r * 4}px ${COR.ciano}`, filter: `blur(${desfoque}px)`, opacity: 0.55 + 0.45 * Math.sin(seg * p.v * 2 + p.fase) ** 2 }} />;
          })}
        </div>
      </AbsoluteFill>
      {/* luz de cena, vinheta e grão */}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(70% 50% at 70% 10%, rgba(76,155,232,.12), transparent 70%)" }} />
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(120% 85% at 50% 46%, transparent 50%, rgba(0,0,0,.7))" }} />
      <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.1, mixBlendMode: "overlay", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div style={{ position: "absolute", left: 56 * k, top: 54 * k, fontFamily: MONO, fontSize: 20 * k, letterSpacing: ".22em", textTransform: "uppercase", color: COR.bebe,
        opacity: interpolate(seg, [0.5, 1.5], [0, 0.55], { extrapolateRight: "clamp" }) * (1 - final) }}>Guilherme · portfólio 2026</div>
      {/* final: a câmera recua e o nome aparece por cima, sem corte */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", background: `rgba(3,6,13,${0.62 * final})`, opacity: final }}>
        <div style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 150 * k * (formato === "story" ? 1 : 0.86), letterSpacing: "-.045em", lineHeight: 0.9, transform: `translateY(${(1 - final) * 30}px)`,
          background: `linear-gradient(110deg, ${COR.bebe} 35%, ${COR.ciano} 50%, ${COR.bebe} 65%)`, backgroundSize: "300% 100%", backgroundPosition: `${interpolate(seg, [DURACAO - 3, DURACAO], [100, 0], { extrapolateLeft: "clamp" })}% 0`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>GUILHERME</div>
        <div style={{ marginTop: 20 * k, fontFamily: OUTFIT, fontWeight: 500, fontSize: 40 * k, color: COR.bebe }}>Sites, sistemas e marketing</div>
        <div style={{ marginTop: 40 * k, fontFamily: MONO, fontSize: 26 * k, letterSpacing: ".08em", color: COR.ciano }}>guilhermeslvg.github.io/guilherme-site</div>
        <div style={{ marginTop: 12 * k, fontFamily: OUTFIT, fontWeight: 800, fontSize: 40 * k, color: "#fff" }}>@guiilhermesg_</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Cinemas: React.FC = () => (
  <>
    <Composition id="CinemaStory" component={Filme} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ formato: "story" as const }} />
    <Composition id="CinemaFeed" component={Filme} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} defaultProps={{ formato: "feed" as const }} />
  </>
);
