import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { REEL } from "@/data/projects";
import { announceMediaPlay, icon } from "@/lib/media";
import { PokeButton } from "./ui/PokeButton";
import { Reveal } from "./ui/Reveal";

/** Vídeo/GIF de destaque do Verity. */
export function Reel() {
  const reduce = useReducedMotion();
  // GIF não tem controle nativo: alternamos entre o GIF e o print estático.
  // Com movimento reduzido, começa parado.
  const [playing, setPlaying] = useState(!reduce);

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
            <div className="win-titlebar" aria-hidden="true">
              <span className="win-dots"><i /><i /><i /></span>
              <span>{REEL.video ? "reel.mp4" : "reel.gif"}</span>
            </div>
            <div className="relative aspect-video bg-[#1d1430]">
              {REEL.video ? (
                <video
                  className="h-full w-full"
                  controls
                  preload="none"
                  playsInline
                  poster={REEL.poster}
                  aria-label={REEL.alt}
                  onPlay={announceMediaPlay}
                >
                  <source src={REEL.video} />
                </video>
              ) : (
                <>
                  <img className="pixel h-full w-full object-cover" src={playing ? REEL.gif : REEL.poster} alt={REEL.alt} decoding="async" />
                  <PokeButton
                    size="sm"
                    className="absolute bottom-3 right-3"
                    aria-pressed={playing}
                    icon={icon(playing ? "pause" : "play")}
                    onClick={() => setPlaying((p) => !p)}
                  >
                    {playing ? "Pausar animação" : "Animar"}
                  </PokeButton>
                </>
              )}
            </div>
          </div>
        </Reveal>
        <p className="mt-4 text-center font-bold text-dim">
          Beta do Ato I jogável.{" "}
          <a href="#projeto/verity" className="text-amber underline decoration-2 underline-offset-4">Ler sobre o projeto →</a>
        </p>
      </div>
    </section>
  );
}
