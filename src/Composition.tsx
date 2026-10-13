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

const COR = { noite: "#030916", escuro: "#0c2a6b", azul: "#1d5fd0", claro: "#4c9be8", ciano: "#2cd3f2", bebe: "#d4eaff" };
const FPS = 30;
const ABERTURA = 80; // nome entrando
const GRAVACAO = 420; // o portfólio rolando (14 s)
const FINAL = 100; // link e @
const TOTAL = ABERTURA + GRAVACAO + FINAL - 20; // as partes se cruzam 10 quadros de cada lado

// fundo: azul-noite com duas manchas de luz andando devagar
const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  const x = 70 + Math.sin(f / 60) * 12, y = 20 + Math.cos(f / 75) * 8;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(55% 50% at ${x}% ${y}%, rgba(44,211,242,.22), transparent 70%), radial-gradient(60% 55% at ${100 - x}% ${100 - y}%, rgba(29,95,208,.4), transparent 70%), linear-gradient(160deg, #071433, ${COR.noite} 65%)` }} />
  );
};

const Rotulo: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: ".24em", textTransform: "uppercase", color: COR.bebe, opacity: 0.75, ...style }}>{children}</div>
);

// 1. abertura: "Prazer, sou" e GUILHERME letra por letra, com a faixa de brilho passando
const Abertura: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nome = "GUILHERME";
  const sai = interpolate(f, [ABERTURA - 14, ABERTURA], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brilho = interpolate(f, [28, 70], [130, -60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: sai }}>
      <Rotulo style={{ opacity: interpolate(f, [0, 12], [0, 0.75], { extrapolateRight: "clamp" }), marginBottom: 18 }}>Prazer, sou</Rotulo>
      <div style={{ display: "flex", fontFamily: OUTFIT, fontWeight: 900, fontSize: 250, letterSpacing: "-.04em", lineHeight: 0.85,
        background: `linear-gradient(110deg, ${COR.bebe} ${brilho - 12}%, ${COR.ciano} ${brilho}%, ${COR.bebe} ${brilho + 12}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        {nome.split("").map((l, i) => {
          const s = spring({ frame: f - 4 - i * 3, fps, config: { damping: 14, mass: 0.6 } });
          return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - s) * 120}px)`, opacity: s }}>{l}</span>;
        })}
      </div>
      <div style={{ marginTop: 28, fontFamily: OUTFIT, fontWeight: 500, fontSize: 40, color: COR.bebe,
        opacity: interpolate(f, [34, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(f, [34, 48], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
        Sites, sistemas e marketing
      </div>
    </AbsoluteFill>
  );
};

// legendas do meio, trocando conforme a parte do site que está passando
const LEGENDAS: [number, string, string][] = [
  [0, "Abertura", "A foto vira armadura com a rolagem"],
  [128, "Serviços", "Portfólios, landing pages animadas e sistemas"],
  [164, "Projetos no ar", "Sites de clientes numa faixa curva"],
  [182, "Para devs", "Minha framework de efeitos, feita do zero"],
  [256, "Jarvis", "Assistente por voz que eu mesmo criei"],
  [274, "Como funciona", "Do primeiro oi ao site no ar"],
  [345, "Contato", "Quatro perguntas e a mensagem pronta no WhatsApp"],
];

// 2. o portfólio rolando dentro de uma janela de navegador que entra inclinada e se endireita
const Gravacao: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 18, mass: 0.9 } });
  const sai = interpolate(f, [GRAVACAO - 12, GRAVACAO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, GRAVACAO], [1, 1.04], { easing: Easing.inOut(Easing.ease) });
  let atual = 0;
  LEGENDAS.forEach(([ini], i) => { if (f >= ini) atual = i; });
  const [ini, titulo, texto] = LEGENDAS[atual];
  const leg = interpolate(f - ini, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: sai, perspective: 1600 }}>
      <div style={{ width: 1500, borderRadius: 26, overflow: "hidden", background: "#0b1630", boxShadow: `0 0 0 1.5px rgba(212,234,255,.18), 0 60px 120px rgba(0,0,0,.55), 0 0 90px rgba(44,211,242,.18)`,
        transform: `translateY(${(1 - entra) * 140}px) rotateX(${(1 - entra) * 18}deg) scale(${(0.86 + entra * 0.06) * zoom})`, opacity: entra }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 20px", background: "#0f1d3d" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: 13, background: c }} />)}
          <div style={{ flex: 1, margin: "0 120px", height: 30, borderRadius: 9, background: "rgba(212,234,255,.08)", display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 16, color: COR.bebe, opacity: 0.85 }}>
            guilhermeslvg.github.io/guilherme-site
          </div>
        </div>
        <OffthreadVideo src={staticFile("portfolio.mp4")} muted style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ position: "absolute", left: 90, bottom: 58, opacity: entra * leg, transform: `translateY(${(1 - leg) * 18}px)`,
        padding: "18px 26px", borderRadius: 18, background: "rgba(3,9,22,.82)", border: "1.5px solid rgba(44,211,242,.35)" }}>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: ".2em", textTransform: "uppercase", color: COR.ciano }}>{titulo}</div>
        <div style={{ marginTop: 6, fontFamily: OUTFIT, fontWeight: 800, fontSize: 36, color: "#fff", letterSpacing: "-.02em" }}>{texto}</div>
      </div>
    </AbsoluteFill>
  );
};

// 3. final: o link do portfólio e o @
const Final: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 16 } });
  const b = spring({ frame: f - 10, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Rotulo style={{ opacity: a * 0.75 }}>Veja ao vivo</Rotulo>
      <div style={{ marginTop: 22, fontFamily: OUTFIT, fontWeight: 900, fontSize: 96, letterSpacing: "-.035em", color: "#fff", transform: `translateY(${(1 - a) * 50}px)`, opacity: a }}>
        guilhermeslvg.github.io/<span style={{ background: `linear-gradient(90deg, ${COR.claro}, ${COR.ciano})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>guilherme-site</span>
      </div>
      <div style={{ marginTop: 26, fontFamily: OUTFIT, fontWeight: 800, fontSize: 52, color: COR.bebe, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>@guiilhermesg_</div>
    </AbsoluteFill>
  );
};

const Video: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COR.noite }}>
    <Fundo />
    <Sequence durationInFrames={ABERTURA}><Abertura /></Sequence>
    <Sequence from={ABERTURA - 10} durationInFrames={GRAVACAO}><Gravacao /></Sequence>
    <Sequence from={ABERTURA + GRAVACAO - 20}><Final /></Sequence>
  </AbsoluteFill>
);

export const MyComposition: React.FC = () => (
  <Composition id="Portfolio" component={Video} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
