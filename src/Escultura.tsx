// Vídeo "Escultura" (no estilo do modelo 2): o celular sai de uma massa orgânica de metal escuro com textura de escamas,
// contra um degradê azul forte. A massa respira devagar; no final ela sobe e engole o celular e entra o cartão com o nome.
import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, Composition, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as carregarOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";
import { Celular3D } from "./tres/Celular3D";
import marcos from "./marcos.json";

const { fontFamily: OUTFIT } = carregarOutfit("normal", { weights: ["500", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = carregarMono("normal", { weights: ["500"], subsets: ["latin"] });

const FPS = 30, INICIO_TELA = 2.4;
const ENGOLE = Math.round((INICIO_TELA + marcos.fim - 1.2) * FPS); // a massa sobe depois que o contato aparece
const CARTAO = ENGOLE + 3 * FPS; // entra o nome
const TOTAL = CARTAO + Math.round(3.6 * FPS), DURACAO = TOTAL / FPS;

// reflexos de estúdio (sem baixar nada: ambiente gerado na hora)
const Ambiente: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

// textura de escamas em relevo, desenhada uma vez
function texturaEscamas() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000"; g.fillRect(0, 0, 512, 512);
  const r = 18;
  for (let lin = -1; lin < 512 / (r * 1.5) + 2; lin++) {
    for (let col = -1; col < 512 / (r * 1.7) + 2; col++) {
      const x = col * r * 1.75 + (lin % 2 ? r * 0.875 : 0), y = lin * r * 1.5;
      const d = g.createRadialGradient(x, y - r * 0.3, 1, x, y, r);
      d.addColorStop(0, "#fff"); d.addColorStop(0.75, "#777"); d.addColorStop(1, "#000");
      g.fillStyle = d; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 6); return t;
}

// uma "bolha" de massa: esfera deformada por ruído que muda com o tempo (calculada a cada quadro)
const ruido = new SimplexNoise({ random: () => 0.37 });
const Massa: React.FC<{ pos: [number, number, number]; esc: [number, number, number]; semente: number; forca: number; t: number; material: THREE.Material }> = ({ pos, esc, semente, forca, t, material }) => {
  const base = useMemo(() => { const g = mergeVertices(new THREE.IcosahedronGeometry(1, 6)); g.deleteAttribute("normal"); return g; }, []);
  const original = useMemo(() => Float32Array.from(base.attributes.position.array as Float32Array), [base]);
  const geo = useMemo(() => { const g = base.clone(); return g; }, [base]);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = original[i * 3], y = original[i * 3 + 1], z = original[i * 3 + 2];
    const n1 = ruido.noise4d(x * 1.3 + semente, y * 1.3, z * 1.3, t * 0.25);
    const n2 = ruido.noise4d(x * 2.4, y * 2.4 + semente, z * 2.4, t * 0.35) * 0.22;
    const n3 = ruido.noise3d(x * 5 + semente, y * 5, z * 5) * 0.025;
    const d = 1 + (n1 + n2) * forca + n3;
    p.setXYZ(i, x * d, y * d, z * d);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return <mesh geometry={geo} material={material} position={pos} scale={esc} />;
};

const Cena: React.FC<{ formato: "story" | "feed" }> = ({ formato }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const escamas = useMemo(texturaEscamas, []);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#01040c", metalness: 0.9, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28,
    bumpMap: escamas, bumpScale: 1.8, envMapIntensity: 0.14, sheen: 0.05, sheenColor: new THREE.Color("#2cd3f2"),
  }), [escamas]);
  // a massa sobe e cresce no fim
  const sobe = interpolate(f, [ENGOLE, CARTAO + 20], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cresce = 1 + sobe * 0.7;
  // celular: entra subindo de dentro da massa e balança devagar
  const entra = interpolate(f, [0, 2.2 * FPS], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
  const celY = -1.1 + entra * 1.18 + Math.sin(t * 0.6) * 0.025 - sobe * 0.35;
  const giroY = -0.42 + Math.sin(t * 0.32) * 0.2 + entra * 0.12;
  const giroZ = -0.16 + Math.sin(t * 0.25) * 0.05;
  const zoomCam = formato === "story" ? 1 : 0.98;
  const mundoZ = interpolate(f, [0, ENGOLE, CARTAO], [-0.2, 0.25, 0.8], { extrapolateRight: "clamp" });
  return (
    <group scale={zoomCam} position={[0, 0, mundoZ]}>
      <Ambiente />
      <ambientLight intensity={0.25} />
      <directionalLight position={[2.5, 3, 4]} intensity={1.6} color="#e8f4ff" />
      <pointLight position={[-2.2, 0.4, 1.5]} intensity={14} distance={7} color="#2cd3f2" />
      <pointLight position={[2.2, -1, 1.2]} intensity={12} distance={7} color="#4c9be8" />
      <spotLight position={[0, 4, 3]} angle={0.5} penumbra={0.8} intensity={30} color="#ffffff" />
      <Celular3D velocidade={1} inicioVideo={Math.round(INICIO_TELA * FPS)} posicao={[0, celY, 0]} rotacao={[0.06, giroY, giroZ]} />
      {/* massa: base embaixo, dois "dedos" segurando dos lados e uma dobra na frente */}
      <Massa pos={[0, -1.45 + sobe * 1.5, -0.25]} esc={[2.2 * cresce, 1.0 * cresce, 1.25]} semente={1} forca={0.32} t={t} material={material} />
      <Massa pos={[-0.62, -0.62 + sobe * 1.3, 0.12]} esc={[0.42 * cresce, 0.85 * cresce, 0.45]} semente={7} forca={0.3} t={t} material={material} />
      <Massa pos={[0.66, -0.55 + sobe * 1.35, 0.08]} esc={[0.4 * cresce, 0.92 * cresce, 0.42]} semente={13} forca={0.3} t={t} material={material} />
      <Massa pos={[0.08, -1.05 + sobe * 1.6, 0.55]} esc={[0.85 * cresce, 0.5 * cresce, 0.5]} semente={21} forca={0.36} t={t} material={material} />
    </group>
  );
};

const Video: React.FC<{ formato: "story" | "feed" }> = ({ formato }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = width / 1080;
  const cartao = interpolate(f, [CARTAO, CARTAO + 22], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brilho = interpolate(f, [CARTAO + 10, TOTAL], [120, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const luz = interpolate(f, [0, TOTAL], [0, 1]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 60% at ${25 + luz * 20}% 0%, #8fe7fb 0%, #2cd3f2 22%, #1d5fd0 55%, #0c2a6b 85%, #071433 100%)` }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 4.9], fov: 32 }} gl={{ alpha: true, antialias: true }}>
        <Cena formato={formato} />
      </ThreeCanvas>
      {/* luz suave por cima e vinheta, como lente de câmera */}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(130% 90% at 50% 40%, transparent 60%, rgba(3,9,22,.55))" }} />
      <div style={{ position: "absolute", left: 56 * k, top: 54 * k, fontFamily: MONO, fontSize: 20 * k, letterSpacing: ".22em", textTransform: "uppercase", color: "#ffffff",
        opacity: interpolate(f, [20, 40], [0, 0.75], { extrapolateRight: "clamp" }) * (1 - cartao) }}>Guilherme · web designer</div>
      <div style={{ position: "absolute", right: 56 * k, top: 54 * k, fontFamily: MONO, fontSize: 20 * k, letterSpacing: ".22em", color: "#ffffff",
        opacity: interpolate(f, [20, 40], [0, 0.75], { extrapolateRight: "clamp" }) * (1 - cartao) }}>2026</div>
      {/* cartão final por cima da massa */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: cartao, background: `rgba(3,9,22,${0.55 * cartao})` }}>
        <div style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 150 * k * (formato === "story" ? 1 : 0.86), letterSpacing: "-.045em", lineHeight: 0.9, transform: `translateY(${(1 - cartao) * 40}px)`,
          color: "#d4eaff", textShadow: `0 0 ${30 + Math.max(0, 60 - Math.abs(brilho - 40))}px rgba(44,211,242,.55)` }}>GUILHERME</div>
        <div style={{ marginTop: 20 * k, fontFamily: OUTFIT, fontWeight: 500, fontSize: 40 * k, color: "#d4eaff" }}>Sites, sistemas e marketing</div>
        <div style={{ marginTop: 40 * k, fontFamily: MONO, fontSize: 26 * k, letterSpacing: ".08em", color: "#2cd3f2" }}>guilhermeslvg.github.io/guilherme-site</div>
        <div style={{ marginTop: 12 * k, fontFamily: OUTFIT, fontWeight: 800, fontSize: 40 * k, color: "#fff" }}>@guiilhermesg_</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Esculturas: React.FC = () => (
  <>
    <Composition id="EsculturaStory" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ formato: "story" as const }} />
    <Composition id="EsculturaFeed" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} defaultProps={{ formato: "feed" as const }} />
  </>
);
