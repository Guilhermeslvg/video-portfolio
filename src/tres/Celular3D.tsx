// iPhone em 3D (three.js), no estilo da linha Pro em titânio azul: laterais retas com cantos arredondados, borda fina,
// Dynamic Island, botões de ação, volume, liga/desliga e câmera, traseira de vidro fosco com o bloco de três câmeras.
// O site gravado roda na tela. Opcionalmente começa com uma tela de abertura (logo "G").
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Sequence, interpolate, staticFile, useCurrentFrame, useDelayRender } from "remotion";
import marcos from "../marcos.json";

export const TELA_L = 0.74, TELA_A = 1.6; // tela na proporção da gravação (780 x 1688, a mesma do iPhone)
const BORDA = 0.022; // borda preta em volta da tela
const L = TELA_L + BORDA * 2 + 0.016, A = TELA_A + BORDA * 2 + 0.016; // corpo
const ESP = 0.082, CHANFRO = 0.007;
const RAIO = L * 0.17, RAIO_TELA = TELA_L * 0.15;
const FRENTE = ESP / 2 + CHANFRO;

function retangulo(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// forma plana com UV de 0 a 1 (para a textura do site ocupar a tela inteira)
function plano(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(retangulo(w, h, r), 24), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}
function bloco(w: number, h: number, r: number, prof: number, chanfro: number) {
  const g = new THREE.ExtrudeGeometry(retangulo(w - chanfro * 2, h - chanfro * 2, Math.max(0.001, r - chanfro)), {
    depth: prof, bevelEnabled: true, bevelThickness: chanfro, bevelSize: chanfro, bevelSegments: 5, curveSegments: 28,
  });
  g.translate(0, 0, -prof / 2);
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
export const QUADROS_TELA = marcos.quadros;
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
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
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
  return <mesh geometry={geo} position={[0, 0, FRENTE + 0.002]}><meshBasicMaterial key={tex ? "com" : "sem"} map={tex} color={tex ? "#ffffff" : "#000000"} toneMapped={false} /></mesh>;
};

// botão lateral em formato de cápsula
const Botao: React.FC<{ x: number; y: number; altura: number; material: THREE.Material }> = ({ x, y, altura, material }) => (
  <mesh position={[x, y, 0]} material={material}><capsuleGeometry args={[0.0075, altura, 6, 12]} /></mesh>
);

export const Celular3D: React.FC<{ velocidade: number; inicioVideo?: number; posicao?: [number, number, number]; rotacao?: [number, number, number]; escala?: number }> = ({
  velocidade, inicioVideo = 0, posicao = [0, 0, 0], rotacao = [0, 0, 0], escala = 1,
}) => {
  const f = useCurrentFrame();
  const geo = useMemo(() => ({
    corpo: bloco(L, A, RAIO, ESP, CHANFRO),
    vidro: plano(L - 0.012, A - 0.012, RAIO - 0.006),
    tela: plano(TELA_L, TELA_A, RAIO_TELA),
    ilha: plano(TELA_L * 0.27, TELA_A * 0.029, TELA_A * 0.0145),
    traseira: plano(L - 0.012, A - 0.012, RAIO - 0.006),
    placa: bloco(L * 0.46, L * 0.46, L * 0.11, 0.012, 0.004),
  }), []);
  const mat = useMemo(() => ({
    titanio: new THREE.MeshPhysicalMaterial({ color: "#3a4a63", metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
    vidroPreto: new THREE.MeshPhysicalMaterial({ color: "#020203", metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
    fosco: new THREE.MeshPhysicalMaterial({ color: "#33415a", metalness: 0.3, roughness: 0.55, clearcoat: 0.3 }),
    lente: new THREE.MeshPhysicalMaterial({ color: "#05070b", metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
    anel: new THREE.MeshPhysicalMaterial({ color: "#5a6a85", metalness: 1, roughness: 0.25 }),
    reflexo: new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.06, roughness: 0.02, clearcoat: 1 }),
  }), []);
  const logo = useMemo(() => (inicioVideo > 0 ? texturaLogo() : null), [inicioVideo]);
  const opLogo = inicioVideo > 0 ? interpolate(f, [inicioVideo - 14, inicioVideo + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const lado = L / 2 + 0.002;
  return (
    <group position={posicao} rotation={rotacao} scale={escala}>
      <mesh geometry={geo.corpo} material={mat.titanio} />
      {/* frente: vidro preto, tela, Dynamic Island e reflexo */}
      <mesh geometry={geo.vidro} material={mat.vidroPreto} position={[0, 0, FRENTE + 0.0008]} />
      <Sequence from={inicioVideo} layout="none"><TelaVideo geo={geo.tela} velocidade={velocidade} /></Sequence>
      {logo && opLogo > 0 && <mesh geometry={geo.tela} position={[0, 0, FRENTE + 0.003]}><meshBasicMaterial map={logo} transparent opacity={opLogo} toneMapped={false} /></mesh>}
      <mesh geometry={geo.ilha} position={[0, TELA_A / 2 - TELA_A * 0.03, FRENTE + 0.0045]}><meshBasicMaterial color="#000" /></mesh>
      <mesh geometry={geo.vidro} material={mat.reflexo} position={[0, 0, FRENTE + 0.006]} />
      {/* botões: ação e volume à esquerda; liga/desliga e câmera à direita */}
      <Botao x={-lado} y={A * 0.29} altura={0.045} material={mat.titanio} />
      <Botao x={-lado} y={A * 0.19} altura={0.09} material={mat.titanio} />
      <Botao x={-lado} y={A * 0.09} altura={0.09} material={mat.titanio} />
      <Botao x={lado} y={A * 0.2} altura={0.14} material={mat.titanio} />
      <Botao x={lado} y={-A * 0.12} altura={0.07} material={mat.titanio} />
      {/* traseira: vidro fosco e o bloco de câmeras */}
      <mesh geometry={geo.traseira} material={mat.fosco} position={[0, 0, -FRENTE - 0.0008]} rotation={[0, Math.PI, 0]} />
      <group position={[L * 0.2, A / 2 - L * 0.3, -FRENTE - 0.006]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geo.placa} material={mat.fosco} />
        {[[-0.075, 0.075], [-0.075, -0.075], [0.08, 0]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={mat.anel}><cylinderGeometry args={[0.058, 0.058, 0.016, 40]} /></mesh>
            <mesh material={mat.lente} position={[0, 0.0085, 0]}><cylinderGeometry args={[0.042, 0.042, 0.002, 40]} /></mesh>
          </group>
        ))}
        <mesh position={[0.08, 0.1, 0.008]}><circleGeometry args={[0.016, 20]} /><meshStandardMaterial color="#d8dde6" emissive="#ffffff" emissiveIntensity={0.15} /></mesh>
      </group>
    </group>
  );
};
