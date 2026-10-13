// Vídeo no estilo "mockup 3D cinematográfico": um celular preto deitado sobre uma mesa escura de ripas, com a câmera
// se movendo devagar entre ângulos (de cima, inclinado, close na tela, em pé) e o site rolando na tela. Sem legenda e sem voz.
import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as carregarOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: OUTFIT } = carregarOutfit("normal", { weights: ["500", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = carregarMono("normal", { weights: ["500"], subsets: ["latin"] });

const FPS = 30;
const COR = { ciano: "#2cd3f2", bebe: "#d4eaff", claro: "#4c9be8" };

// câmera: rx/ry/rz em graus, s = zoom, x/y = deslocamento do mundo (px), foco = posição vertical da tela (0 topo, 1 base)
type Cam = { rx: number; ry: number; rz: number; s: number; x: number; y: number };
type Cena = { dur: number; video: number; de: Cam; para: Cam };
// video = segundo da gravação do celular onde a cena começa (hero 0, serviços 5.4, projetos 11.1, efeitos 16.1, jarvis 21.3, processo 24.9, contato 29.2)
const CENAS: Cena[] = [
  { dur: 3.4, video: 0.2, de: { rx: 56, ry: 0, rz: -30, s: 1.0, x: 0, y: -40 }, para: { rx: 50, ry: 0, rz: -22, s: 1.18, x: 0, y: -80 } },
  { dur: 3.6, video: 1.6, de: { rx: 40, ry: -6, rz: 18, s: 2.1, x: -60, y: 560 }, para: { rx: 36, ry: -4, rz: 12, s: 2.35, x: -20, y: 420 } },
  { dur: 3.8, video: 5.6, de: { rx: 8, ry: -22, rz: -6, s: 1.08, x: 0, y: 20 }, para: { rx: 6, ry: 18, rz: -3, s: 1.14, x: 0, y: 0 } },
  { dur: 3.4, video: 11.2, de: { rx: 62, ry: 0, rz: 28, s: 1.55, x: 120, y: 260 }, para: { rx: 58, ry: 0, rz: 20, s: 1.7, x: 40, y: 120 } },
  { dur: 3.8, video: 16.2, de: { rx: 34, ry: 10, rz: -14, s: 2.4, x: 30, y: 300 }, para: { rx: 30, ry: 8, rz: -8, s: 2.2, x: 10, y: 180 } },
  { dur: 3.4, video: 21.4, de: { rx: 10, ry: 24, rz: 4, s: 1.12, x: 0, y: 30 }, para: { rx: 12, ry: -14, rz: 2, s: 1.2, x: 0, y: 0 } },
  { dur: 3.4, video: 25.0, de: { rx: 64, ry: 0, rz: -18, s: 1.9, x: -80, y: -120 }, para: { rx: 60, ry: 0, rz: -26, s: 2.05, x: -40, y: -240 } },
  { dur: 3.6, video: 29.4, de: { rx: 46, ry: 0, rz: 30, s: 1.2, x: 0, y: 40 }, para: { rx: 50, ry: 0, rz: 38, s: 1.0, x: 260, y: 80 } },
];
const INICIOS = CENAS.map((_, i) => Math.round(CENAS.slice(0, i).reduce((s, c) => s + c.dur, 0) * FPS));
const CORPO = Math.round(CENAS.reduce((s, c) => s + c.dur, 0) * FPS);
const FINAL = 96;
const TOTAL = CORPO + FINAL;
const TRANS = 7; // quadros de passagem entre cenas

const mistura = (a: Cam, b: Cam, t: number): Cam => ({ rx: a.rx + (b.rx - a.rx) * t, ry: a.ry + (b.ry - a.ry) * t, rz: a.rz + (b.rz - a.rz) * t, s: a.s + (b.s - a.s) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// o celular: corpo preto de titânio, botões laterais, tela com o site e um reflexo de luz passando no vidro
const Celular: React.FC<{ altura: number; video: number; brilho: number }> = ({ altura, video, brilho }) => {
  const largura = Math.round(altura * (780 / 1688));
  const borda = Math.round(altura * 0.018);
  return (
    <div style={{ position: "relative", width: largura + borda * 2, height: altura + borda * 2, padding: borda, borderRadius: altura * 0.09,
      background: "linear-gradient(135deg, #3a3f4a 0%, #0d0f14 18%, #1b1f27 50%, #07080b 80%, #2a2f39 100%)",
      boxShadow: "inset 0 0 0 2px rgba(255,255,255,.08), inset 0 0 0 5px #050608" }}>
      {/* botões laterais */}
      {[[0.2, 0.06], [0.3, 0.1], [0.43, 0.1]].map(([t, h], i) => <span key={i} style={{ position: "absolute", left: -4, top: altura * t, width: 4, height: altura * h, borderRadius: 3, background: "#1c2029" }} />)}
      <span style={{ position: "absolute", right: -4, top: altura * 0.3, width: 4, height: altura * 0.14, borderRadius: 3, background: "#1c2029" }} />
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: altura * 0.074, overflow: "hidden", background: "#000" }}>
        <OffthreadVideo src={staticFile("celular.mp4")} startFrom={Math.round(video * FPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", top: altura * 0.013, left: "50%", width: largura * 0.3, height: altura * 0.032, marginLeft: -largura * 0.15, borderRadius: 999, background: "#000" }} />
        {/* reflexo no vidro */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${brilho - 18}%, rgba(255,255,255,.13) ${brilho}%, transparent ${brilho + 18}%)` }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 40px rgba(0,0,0,.35)" }} />
      </div>
    </div>
  );
};

// a mesa: ripas escuras com uma luz azul fria vinda de um lado
const Mesa: React.FC<{ largura: number; altura: number }> = ({ largura, altura }) => (
  <div style={{ position: "absolute", left: -largura, top: -altura, width: largura * 3, height: altura * 3,
    background: "radial-gradient(40% 35% at 60% 45%, rgba(76,155,232,.16), transparent 70%), repeating-linear-gradient(90deg, #0b0f19 0 34px, #141b2b 34px 40px, #070a12 40px 44px)",
    filter: "blur(1.2px)" }} />
);

const CenaVideo: React.FC<{ c: Cena; altura: number; w: number; h: number }> = ({ c, altura, w, h }) => {
  const f = useCurrentFrame();
  const q = Math.round(c.dur * FPS);
  const t = interpolate(f, [0, q], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });
  const cam = mistura(c.de, c.para, t);
  const entra = interpolate(f, [0, TRANS], [0, 1], { extrapolateRight: "clamp" });
  const sai = interpolate(f, [q - 2, q + TRANS - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brilho = interpolate(f, [0, q], [-20, 120]);
  return (
    <AbsoluteFill style={{ opacity: Math.min(entra, sai), perspective: 1500, perspectiveOrigin: "50% 45%", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)` }}>
        <Mesa largura={w} altura={h} />
        {/* sombra do celular na mesa */}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: altura * 0.5, height: altura * 1.02, marginLeft: -altura * 0.25, marginTop: -altura * 0.49, borderRadius: altura * 0.1, background: "rgba(0,0,0,.75)", filter: "blur(28px)", transform: "translate(18px, 26px)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateZ(18px)" }}>
          <Celular altura={altura} video={c.video} brilho={brilho} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// assinatura discreta no canto e cartão final
const Assinatura: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 56, top: 54, fontFamily: MONO, fontSize: 20, letterSpacing: ".22em", textTransform: "uppercase", color: COR.bebe,
      opacity: interpolate(f, [10, 30, CORPO - 10, CORPO], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      Guilherme · portfólio 2026
    </div>
  );
};

const Final: React.FC<{ escala: number }> = ({ escala }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - 2, fps, config: { damping: 18 } });
  const b = spring({ frame: f - 12, fps, config: { damping: 18 } });
  const brilho = interpolate(f, [10, 55], [130, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", background: "radial-gradient(60% 40% at 50% 45%, rgba(29,95,208,.35), transparent 70%), #04070f" }}>
      <div style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 150 * escala, letterSpacing: "-.045em", lineHeight: 0.9, opacity: a, transform: `translateY(${(1 - a) * 40}px)`,
        background: `linear-gradient(110deg, ${COR.bebe} ${brilho - 14}%, ${COR.ciano} ${brilho}%, ${COR.bebe} ${brilho + 14}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>GUILHERME</div>
      <div style={{ marginTop: 22 * escala, fontFamily: OUTFIT, fontWeight: 500, fontSize: 40 * escala, color: COR.bebe, opacity: b }}>Sites, sistemas e marketing</div>
      <div style={{ marginTop: 44 * escala, fontFamily: MONO, fontSize: 26 * escala, letterSpacing: ".08em", color: COR.ciano, opacity: b }}>guilhermeslvg.github.io/guilherme-site</div>
      <div style={{ marginTop: 14 * escala, fontFamily: OUTFIT, fontWeight: 800, fontSize: 40 * escala, color: "#fff", opacity: b }}>@guiilhermesg_</div>
    </AbsoluteFill>
  );
};

const Filme: React.FC<{ formato: "story" | "feed" }> = ({ formato }) => {
  const { width, height } = useVideoConfig();
  const story = formato === "story";
  const altura = story ? 1180 : 900;
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      {CENAS.map((c, i) => (
        <Sequence key={i} from={INICIOS[i]} durationInFrames={Math.round(c.dur * FPS) + TRANS}>
          <CenaVideo c={c} altura={altura} w={width} h={height} />
        </Sequence>
      ))}
      {/* vinheta e grão por cima de tudo */}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,.65))" }} />
      <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.12, mixBlendMode: "overlay", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <Assinatura />
      <Sequence from={CORPO}><Final escala={story ? 1 : 0.86} /></Sequence>
    </AbsoluteFill>
  );
};

export const Cinemas: React.FC = () => (
  <>
    <Composition id="CinemaStory" component={Filme} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ formato: "story" as const }} />
    <Composition id="CinemaFeed" component={Filme} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} defaultProps={{ formato: "feed" as const }} />
  </>
);
