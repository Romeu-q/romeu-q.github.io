import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { REEL } from "@/data/projects";
import { announceMediaPlay, icon } from "@/lib/media";
import { Reveal } from "./ui/Reveal";

/** Gravações de gameplay do Verity: uma aba por gravação. */
export function Reel() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  // GIF não tem controle nativo: alternamos entre o GIF e um print estático.
  // Com movimento reduzido, começa parado.
  const [playing, setPlaying] = useState(!reduce);
  const clip = REEL.clips[active];

  return (
    <section id="reel" aria-labelledby="reel-title" className="py-12">
      <div className="mx-auto w-[min(100%-32px,1120px)]">
        <Reveal>
          <h2 id="reel-title" className="mb-6 flex items-center gap-3 font-pixel text-[clamp(1.8rem,4.5vw,2.6rem)] font-bold">
            <img className="pixel h-8 w-8" src={icon("video")} alt="" /> {REEL.title}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass mx-auto max-w-[900px] overflow-hidden rounded-xl">
            <div className="win-titlebar">
              <span className="win-dots" aria-hidden="true"><i /><i /><i /></span>
              {REEL.video ? (
                <span>reel.mp4</span>
              ) : (
                // Abas para trocar de gravação (role tab = leitor de tela entende que é um seletor)
                <div role="tablist" aria-label="Gravações de gameplay" className="flex gap-1">
                  {REEL.clips.map((c, i) => (
                    <button
                      key={c.gif}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-controls="reel-media"
                      onClick={() => setActive(i)}
                      className={`cursor-pointer rounded px-2.5 py-1.5 font-tiny text-[0.6rem] transition-colors ${
                        i === active ? "bg-amber text-ink" : "bg-transparent text-dim hover:bg-white/10 hover:text-text"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div id="reel-media" role="tabpanel" className="relative aspect-video bg-[#1d1430]">
              {REEL.video ? (
                <video
                  className="h-full w-full"
                  controls
                  preload="none"
                  playsInline
                  poster={REEL.poster}
                  aria-label={clip.alt}
                  onPlay={announceMediaPlay}
                >
                  <source src={REEL.video} />
                </video>
              ) : (
                <>
                  {/* key = troca de imagem limpa ao mudar de aba */}
                  <img
                    key={clip.gif + playing}
                    className="pixel h-full w-full object-cover"
                    src={playing ? clip.gif : clip.poster}
                    alt={clip.alt}
                    decoding="async"
                  />
                  {/* Pausar é exigência de acessibilidade (WCAG 2.2.2: movimento
                      com mais de 5 s precisa poder parar), mas fica discreto:
                      só um ícone pequeno, quase transparente até o hover/foco. */}
                  <button
                    type="button"
                    className="absolute right-2 top-2 grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-white/20 bg-black/40 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                    aria-label={playing ? "Pausar gravação" : "Reproduzir gravação"}
                    aria-pressed={!playing}
                    onClick={() => setPlaying((p) => !p)}
                  >
                    <img className="pixel" src={icon(playing ? "pause" : "play")} alt="" width={16} height={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </Reveal>
        <p className="mt-4 text-center font-bold text-dim">
          Gravações reais da beta do Ato I.{" "}
          <a href="#projeto/verity" className="text-amber underline decoration-2 underline-offset-4">Ver galeria e detalhes →</a>
        </p>
      </div>
    </section>
  );
}
