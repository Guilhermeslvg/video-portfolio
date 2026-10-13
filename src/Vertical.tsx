import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
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
import roteiro from "../narracao/roteiro.json";
import voz from "./voz.json";

const { fontFamily: OUTFIT } = carregarOutfit("normal", { weights: ["500", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = carregarMono("normal", { weights: ["500"], subsets: ["latin"] });

const COR = { noite: "#030916", escuro: "#0c2a6b", azul: "#1d5fd0", claro: "#4c9be8", ciano: "#2cd3f2", bebe: "#d4eaff" };
const FPS = 30;
type Trecho = { id: string; segundos: number; titulo: string; etiqueta: string };
const TRECHOS = (roteiro.trechos as Trecho[]).map((t, i, l) => {
  const inicio = Math.round(l.slice(0, i).reduce((s, x) => s + x.segundos, 0) * FPS);
  return { ...t, inicio, quadros: Math.round(t.segundos * FPS) };
});
const ABERTURA = TRECHOS[0].quadros;
const CORPO = TRECHOS.reduce((s, t) => s + t.quadros, 0);
const FINAL = Math.round(roteiro.final * FPS);
const TOTAL = CORPO + FINAL;
const ATRASO_VOZ = 6; // a fala começa 0,2 s depois do corte

type Formato = { formato: "story" | "feed" };

const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  const x = 75 + Math.sin(f / 50) * 14, y = 18 + Math.cos(f / 70) * 10;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(60% 40% at ${x}% ${y}%, rgba(44,211,242,.26), transparent 70%), radial-gradient(70% 45% at ${100 - x}% ${92 - y / 3}%, rgba(29,95,208,.5), transparent 70%), linear-gradient(170deg, #071433, ${COR.noite} 60%)` }}>
      <AbsoluteFill style={{ opacity: 0.16, mixBlendMode: "overlay", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </AbsoluteFill>
  );
};

// barrinhas no topo, uma por trecho, enchendo como nos stories
const Progresso: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 46, left: 60, right: 60, display: "flex", gap: 8 }}>
      {TRECHOS.map((t) => {
        const p = interpolate(f, [t.inicio, t.inicio + t.quadros], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={t.id} style={{ flex: 1, height: 5, borderRadius: 5, background: "rgba(212,234,255,.22)", overflow: "hidden" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", background: COR.bebe }} /></div>;
      })}
    </div>
  );
};

// legenda: as palavras aparecem no ritmo da fala, a da vez em ciano
const Legenda: React.FC<{ t: (typeof TRECHOS)[number]; tamanho: number; largura: number }> = ({ t, tamanho, largura }) => {
  const f = useCurrentFrame();
  const palavras = t.titulo.split(" ");
  const fala = ((voz as Record<string, number>)[t.id] ?? t.segundos) * FPS;
  const porPalavra = fala / palavras.length;
  const entra = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const sai = interpolate(f, [t.quadros - 7, t.quadros], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: sai }}>
      <div style={{ fontFamily: MONO, fontSize: tamanho * 0.32, letterSpacing: ".24em", textTransform: "uppercase", color: COR.ciano, opacity: entra, marginBottom: tamanho * 0.32 }}>{t.etiqueta}</div>
      <div style={{ maxWidth: largura, fontFamily: OUTFIT, fontWeight: 800, fontSize: tamanho, lineHeight: 1.04, letterSpacing: "-.03em", display: "flex", flexWrap: "wrap", gap: `0 ${tamanho * 0.26}px` }}>
        {palavras.map((p, i) => {
          const ini = ATRASO_VOZ + i * porPalavra;
          const v = interpolate(f, [ini - 4, ini + 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const agora = f >= ini - 2 && f < ini + porPalavra + 2;
          return <span key={i} style={{ opacity: 0.18 + v * 0.82, transform: `translateY(${(1 - v) * 14}px)`, color: agora ? COR.ciano : "#fff", transition: "none" }}>{p}</span>;
        })}
      </div>
    </div>
  );
};

// o celular com o site rodando
const Celular: React.FC<{ altura: number }> = ({ altura }) => {
  const largura = Math.round(altura * (780 / 1688)) + 28;
  return (
    <div style={{ width: largura, height: altura + 28, padding: 14, borderRadius: altura * 0.085, background: "linear-gradient(145deg, #e9eef5, #8a93a2 30%, #dfe5ee 55%, #6d7686)",
      boxShadow: "0 0 0 1px rgba(255,255,255,.2), 0 0 90px rgba(44,211,242,.35), 0 60px 120px rgba(0,0,0,.6)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: altura * 0.072, overflow: "hidden", background: "#05070c" }}>
        <OffthreadVideo src={staticFile("celular.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", top: altura * 0.012, left: "50%", width: largura * 0.3, height: altura * 0.032, marginLeft: -largura * 0.15, borderRadius: 999, background: "#05070c" }} />
      </div>
    </div>
  );
};

const Abertura: React.FC<{ escala: number }> = ({ escala }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brilho = interpolate(f, [18, 60], [130, -50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sai = interpolate(f, [ABERTURA - 8, ABERTURA], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: sai }}>
      <div style={{ fontFamily: MONO, fontSize: 30 * escala, letterSpacing: ".26em", textTransform: "uppercase", color: COR.bebe, opacity: interpolate(f, [0, 10], [0, 0.8], { extrapolateRight: "clamp" }) }}>Prazer, eu sou o</div>
      <div style={{ display: "flex", marginTop: 20 * escala, fontFamily: OUTFIT, fontWeight: 900, fontSize: 168 * escala, letterSpacing: "-.045em", lineHeight: 0.9,
        background: `linear-gradient(110deg, ${COR.bebe} ${brilho - 14}%, ${COR.ciano} ${brilho}%, ${COR.bebe} ${brilho + 14}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        {"GUILHERME".split("").map((l, i) => {
          const s = spring({ frame: f - 3 - i * 2.5, fps, config: { damping: 14, mass: 0.6 } });
          return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - s) * 90}px)`, opacity: s }}>{l}</span>;
        })}
      </div>
      <div style={{ marginTop: 26 * escala, fontFamily: OUTFIT, fontWeight: 500, fontSize: 44 * escala, color: COR.bebe, opacity: interpolate(f, [26, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Sites, sistemas e marketing</div>
    </AbsoluteFill>
  );
};

const Final: React.FC<{ escala: number }> = ({ escala }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - 4, fps, config: { damping: 16 } });
  const b = spring({ frame: f - 12, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: 60 }}>
      <div style={{ fontFamily: MONO, fontSize: 28 * escala, letterSpacing: ".24em", textTransform: "uppercase", color: COR.ciano, opacity: a }}>Veja ao vivo</div>
      <div style={{ marginTop: 22 * escala, fontFamily: OUTFIT, fontWeight: 900, fontSize: 74 * escala, lineHeight: 1.02, letterSpacing: "-.035em", color: "#fff", opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>
        guilhermeslvg.github.io<br /><span style={{ background: `linear-gradient(90deg, ${COR.claro}, ${COR.ciano})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>/guilherme-site</span>
      </div>
      <div style={{ marginTop: 34 * escala, padding: `${18 * escala}px ${34 * escala}px`, borderRadius: 999, fontFamily: OUTFIT, fontWeight: 800, fontSize: 46 * escala, color: COR.noite, background: `linear-gradient(90deg, ${COR.bebe}, ${COR.ciano})`, boxShadow: "0 0 50px rgba(44,211,242,.45)", opacity: b, transform: `scale(${0.85 + b * 0.15})` }}>@guiilhermesg_</div>
    </AbsoluteFill>
  );
};

const Video: React.FC<Formato> = ({ formato }) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const story = formato === "story";
  const escala = story ? 1 : 0.86;
  const alturaCel = story ? 1330 : 900;
  const topoCel = story ? 600 : 430;
  const tamLegenda = story ? 78 : 58;
  const sobe = spring({ frame: f - ABERTURA + 4, fps, config: { damping: 18, mass: 1 } });
  const desce = interpolate(f, [CORPO - 6, CORPO + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flutua = Math.sin(f / 22) * 6;
  const giro = interpolate(f, [ABERTURA, CORPO], [-4, 4]);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite, overflow: "hidden" }}>
      <Fundo />
      <Sequence durationInFrames={ABERTURA}><Abertura escala={escala} /></Sequence>
      {/* celular sobe depois da abertura, flutua e desce no final */}
      <Sequence from={ABERTURA - 4} durationInFrames={CORPO - ABERTURA + 14}>
        <AbsoluteFill style={{ alignItems: "center", perspective: 1800 }}>
          <div style={{ position: "absolute", top: topoCel + (1 - sobe) * (height - topoCel + 60) + desce * (height - topoCel + 80) + flutua,
            transform: `rotateY(${giro}deg) rotateX(${(1 - sobe) * 12}deg)` }}>
            <Celular altura={alturaCel} />
          </div>
        </AbsoluteFill>
      </Sequence>
      {TRECHOS.slice(1).map((t) => (
        <Sequence key={t.id} from={t.inicio} durationInFrames={t.quadros}>
          <div style={{ position: "absolute", top: story ? 120 : 92, left: 64, right: 64 }}>
            <Legenda t={t} tamanho={tamLegenda} largura={story ? 950 : 950} />
          </div>
        </Sequence>
      ))}
      {TRECHOS.map((t) => (
        <Sequence key={"voz-" + t.id} from={t.inicio + ATRASO_VOZ}>
          <Audio src={staticFile(`voz/${t.id}.wav`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={CORPO}><Final escala={escala} /></Sequence>
      <Progresso />
    </AbsoluteFill>
  );
};

export const Verticais: React.FC = () => (
  <>
    <Composition id="Story" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ formato: "story" as const }} />
    <Composition id="Feed" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} defaultProps={{ formato: "feed" as const }} />
  </>
);
