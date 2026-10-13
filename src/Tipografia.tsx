// Vídeo "Tipografia" (no estilo do modelo 1): palavras gigantes em linhas deslizando no fundo, que troca de cor e de
// palavras a cada seção do site, com o celular 3D no centro mostrando o site. No final, o cartão com o nome.
import React from "react";
import * as THREE from "three";
import { useMemo } from "react";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, Composition, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as carregarOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";
import { Celular3D, QUADROS_TELA } from "./tres/Celular3D";
import marcos from "./marcos.json";

const { fontFamily: OUTFIT } = carregarOutfit("normal", { weights: ["500", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = carregarMono("normal", { weights: ["500"], subsets: ["latin"] });

const FPS = 30;
const VEL = 1; // a tela roda em velocidade normal (a gravação já tem as paradas)
const INICIO = Math.round(0.9 * FPS); // o site começa a rodar na tela
const FIM_SITE = INICIO + Math.round(QUADROS_TELA / VEL);
const CARTAO = FIM_SITE - 6;
const TOTAL = CARTAO + Math.round(3.4 * FPS);
const TROCA = 12; // quadros da passagem de cor

// seções: segundo da gravação em que começam, cor de fundo, cor das palavras e as palavras
type Secao = { seg: number; fundo: string; letra: string; palavras: string[] };
const SECOES: Secao[] = [
  { seg: 0, fundo: "#d4eaff", letra: "#0c2a6b", palavras: ["SITES", "DESIGN", "GUILHERME"] },
  { seg: marcos.painel, fundo: "#2cd3f2", letra: "#06112b", palavras: ["PORTFÓLIOS", "LANDING PAGES", "SISTEMAS"] },
  { seg: marcos.projetos, fundo: "#4c9be8", letra: "#06112b", palavras: ["PROJETOS", "NO AR", "CLIENTES"] },
  { seg: marcos.efeitos, fundo: "#06112b", letra: "#1d5fd0", palavras: ["EFEITOS", "FRAMEWORK", "ANIMAÇÃO"] },
  { seg: marcos.jarvis, fundo: "#1d5fd0", letra: "#030916", palavras: ["AUTOMAÇÃO", "IA", "PROCESSO"] },
  { seg: marcos.contato, fundo: "#d4eaff", letra: "#0c2a6b", palavras: ["WHATSAPP", "ORÇAMENTO", "CONTATO"] },
  { seg: 999, fundo: "#030916", letra: "#0f2350", palavras: ["GUILHERME"] },
];
const quadroSecao = (s: Secao, i: number) => (i === SECOES.length - 1 ? CARTAO : INICIO + Math.round((s.seg * FPS) / VEL));

// uma camada de palavras: linhas que deslizam em sentidos alternados
const Palavras: React.FC<{ s: Secao; f: number; altura: number }> = ({ s, f, altura }) => {
  const tamanho = altura * 0.118;
  const linhas = Math.ceil(altura / (tamanho * 0.86)) + 1;
  return (
    <AbsoluteFill style={{ background: s.fundo, overflow: "hidden" }}>
      {Array.from({ length: linhas }, (_, i) => {
        const texto = Array.from({ length: 6 }, (_, k) => s.palavras[(i + k) % s.palavras.length]).join("  ");
        const dir = i % 2 ? 1 : -1, vel = 2.2 + (i % 3) * 0.7;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: -tamanho * 0.12 + i * tamanho * 0.86, whiteSpace: "nowrap", fontFamily: OUTFIT, fontWeight: 900,
            fontSize: tamanho, lineHeight: 1, letterSpacing: "-.045em", color: s.letra, transform: `translateX(${dir * f * vel - (dir > 0 ? 2600 : 400) - i * 137}px)` }}>
            {texto}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Ambiente: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => { scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture; }, [gl, scene]);
  return null;
};

const Video: React.FC<{ formato: "story" | "feed" }> = ({ formato }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = width / 1080;
  const t = f / FPS;
  // seção atual e a anterior (para a passagem de cor de baixo para cima)
  let atual = 0;
  SECOES.forEach((s, i) => { if (f >= quadroSecao(s, i)) atual = i; });
  const iniAtual = quadroSecao(SECOES[atual], atual);
  const p = atual === 0 ? 1 : interpolate(f - iniAtual, [0, TROCA], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });
  // celular: sobe no começo, gira devagar, desce no final
  const sobe = interpolate(f, [0, INICIO + 6], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
  const desce = interpolate(f, [CARTAO - 4, CARTAO + 18], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const celY = -2.6 + sobe * 2.6 - desce * 3 + Math.sin(t * 0.8) * 0.03;
  const zoom = formato === "story" ? 1.08 : 0.92;
  const cartao = interpolate(f, [CARTAO + 8, CARTAO + 28], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      {atual > 0 && <Palavras s={SECOES[atual - 1]} f={f} altura={height} />}
      <AbsoluteFill style={{ clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}><Palavras s={SECOES[atual]} f={f} altura={height} /></AbsoluteFill>
      {/* sombra macia atrás do celular */}
      <AbsoluteFill style={{ background: "radial-gradient(28% 34% at 50% 54%, rgba(3,9,22,.45), transparent 70%)", opacity: 1 - desce }} />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 4.6], fov: 30 }} gl={{ alpha: true, antialias: true }}>
        <Ambiente />
        <ambientLight intensity={0.35} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <pointLight position={[-2, 1, 2]} intensity={4} distance={6} color="#2cd3f2" />
        <Celular3D velocidade={VEL} inicioVideo={INICIO} escala={zoom} posicao={[0, celY, 0]}
          rotacao={[0.08 + Math.sin(t * 0.5) * 0.04, Math.sin(t * 0.42) * 0.32, Math.sin(t * 0.3) * 0.04]} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 56 * k, top: 54 * k, fontFamily: MONO, fontSize: 20 * k, letterSpacing: ".22em", textTransform: "uppercase", color: SECOES[atual].letra,
        opacity: 0.8 * (1 - cartao) }}>Guilherme · web designer</div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: cartao }}>
        <div style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 150 * k * (formato === "story" ? 1 : 0.86), letterSpacing: "-.045em", lineHeight: 0.9, color: "#d4eaff", transform: `translateY(${(1 - cartao) * 40}px)` }}>GUILHERME</div>
        <div style={{ marginTop: 20 * k, fontFamily: OUTFIT, fontWeight: 500, fontSize: 40 * k, color: "#d4eaff" }}>Sites, sistemas e marketing</div>
        <div style={{ marginTop: 40 * k, fontFamily: MONO, fontSize: 26 * k, letterSpacing: ".08em", color: "#2cd3f2" }}>guilhermeslvg.github.io/guilherme-site</div>
        <div style={{ marginTop: 12 * k, fontFamily: OUTFIT, fontWeight: 800, fontSize: 40 * k, color: "#fff" }}>@guiilhermesg_</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Tipografias: React.FC = () => (
  <>
    <Composition id="TipografiaStory" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ formato: "story" as const }} />
    <Composition id="TipografiaFeed" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} defaultProps={{ formato: "feed" as const }} />
  </>
);
