// Celular em 3D de verdade (three.js): corpo de metal com cantos arredondados, botões laterais, ilha na tela
// e o site gravado rodando na tela como textura de vídeo. Opcionalmente começa com uma tela de abertura (logo "G").
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useThree } from "@react-three/fiber";
import { Sequence, interpolate, staticFile, useCurrentFrame, useDelayRender } from "remotion";

export const TELA_L = 0.74, TELA_A = 1.6; // tela na proporção da gravação (780 x 1688)
const CORPO_L = TELA_L + 0.06, CORPO_A = TELA_A + 0.07, ESP = 0.085;

// retângulo de cantos arredondados com UV de 0 a 1 (para a textura do site ocupar a tela inteira)
function telaGeo(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 16), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  return g;
}

// tela de abertura: degradê claro com um "G" e uma estrelinha de brilho
function texturaLogo() {
  const c = document.createElement("canvas"); c.width = 740; c.height = 1600;
  const g = c.getContext("2d")!;
  const d = g.createLinearGradient(0, 0, 740, 1600); d.addColorStop(0, "#e8f4ff"); d.addColorStop(1, "#bfe0ff");
  g.fillStyle = d; g.fillRect(0, 0, 740, 1600);
  g.fillStyle = "#0c2a6b"; g.font = "900 300px Outfit, Arial Black, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("G", 370, 760);
  g.fillStyle = "#2cd3f2"; g.beginPath(); const cx = 520, cy = 600, r = 60;
  g.moveTo(cx, cy - r); g.quadraticCurveTo(cx, cy, cx + r, cy); g.quadraticCurveTo(cx, cy, cx, cy + r); g.quadraticCurveTo(cx, cy, cx - r, cy); g.quadraticCurveTo(cx, cy, cx, cy - r); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// a tela usa as imagens da gravação do celular (public/tela/qNNNN.jpg). Cada quadro carrega a imagem certa e só
// libera a captura depois de redesenhar a cena com ela (o ThreeCanvas não redesenha sozinho quando a imagem chega).
export const QUADROS_TELA = 1005;
const TelaVideo: React.FC<{ geo: THREE.BufferGeometry; velocidade: number }> = ({ geo, velocidade }) => {
  const f = useCurrentFrame();
  const { advance } = useThree();
  const { delayRender, continueRender } = useDelayRender();
  const idx = Math.max(0, Math.min(QUADROS_TELA - 1, Math.round(f * velocidade)));
  const src = staticFile(`tela/q${String(idx).padStart(4, "0")}.jpg`);
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const espera = useRef<number | null>(null);
  useLayoutEffect(() => {
    let vivo = true;
    const h = delayRender("tela do celular " + idx);
    new THREE.TextureLoader().load(src, (t) => {
      if (!vivo) { t.dispose(); continueRender(h); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      espera.current = h;
      setTex((velho) => { velho?.dispose(); return t; });
    }, undefined, () => continueRender(h));
    return () => { vivo = false; };
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (espera.current === null) return;
    advance(performance.now());
    const h = espera.current; espera.current = null;
    requestAnimationFrame(() => continueRender(h));
  }, [tex, advance, continueRender]);
  return <mesh geometry={geo} position={[0, 0, ESP / 2 + 0.004]}><meshBasicMaterial key={tex ? "com" : "sem"} map={tex} color={tex ? "#ffffff" : "#000000"} toneMapped={false} /></mesh>;
};

export const Celular3D: React.FC<{ velocidade: number; inicioVideo?: number; posicao?: [number, number, number]; rotacao?: [number, number, number]; escala?: number }> = ({
  velocidade, inicioVideo = 0, posicao = [0, 0, 0], rotacao = [0, 0, 0], escala = 1,
}) => {
  const f = useCurrentFrame();
  const corpo = useMemo(() => new RoundedBoxGeometry(CORPO_L, CORPO_A, ESP, 8, 0.1), []);
  const tela = useMemo(() => telaGeo(TELA_L, TELA_A, 0.085), []);
  const logo = useMemo(() => (inicioVideo > 0 ? texturaLogo() : null), [inicioVideo]);
  const opLogo = inicioVideo > 0 ? interpolate(f, [inicioVideo - 14, inicioVideo + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <group position={posicao} rotation={rotacao} scale={escala}>
      <mesh geometry={corpo}>
        <meshPhysicalMaterial color="#15181f" metalness={0.85} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      {/* botões laterais */}
      {[[0.38, 0.12], [0.2, 0.17], [0.0, 0.17]].map(([y, h], i) => (
        <mesh key={i} position={[-CORPO_L / 2 - 0.006, y, 0]}><boxGeometry args={[0.014, h, 0.03]} /><meshStandardMaterial color="#20242c" metalness={0.8} roughness={0.35} /></mesh>
      ))}
      <mesh position={[CORPO_L / 2 + 0.006, 0.22, 0]}><boxGeometry args={[0.014, 0.24, 0.03]} /><meshStandardMaterial color="#20242c" metalness={0.8} roughness={0.35} /></mesh>
      {/* tela */}
      <Sequence from={inicioVideo} layout="none"><TelaVideo geo={tela} velocidade={velocidade} /></Sequence>
      {logo && opLogo > 0 && (
        <mesh geometry={tela} position={[0, 0, ESP / 2 + 0.006]}><meshBasicMaterial map={logo} transparent opacity={opLogo} toneMapped={false} /></mesh>
      )}
      {/* ilha */}
      <mesh position={[0, TELA_A / 2 - 0.032, ESP / 2 + 0.008]}><circleGeometry args={[0.016, 24]} /><meshBasicMaterial color="#000" /></mesh>
      {/* vidro: reflexo fraco por cima da tela */}
      <mesh geometry={tela} position={[0, 0, ESP / 2 + 0.01]}>
        <meshPhysicalMaterial transparent opacity={0.08} roughness={0.05} metalness={0} clearcoat={1} color="#ffffff" />
      </mesh>
    </group>
  );
};
