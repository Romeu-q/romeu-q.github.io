/**
 * MusicPlayer - botão discreto (canto inferior direito) que abre um mini player lo-fi.
 *
 * - Começa recolhido e desligado; nenhum convite, nenhum som automático.
 * - Abrir o painel pela primeira vez inicia a música com fade-in suave.
 * - Toda a lógica de áudio está em `useMusicPlayer`; aqui só há interface e foco.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TRACKS } from '../data/playlist';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

const ICON = 'assets/img/pixel/icon-';

/** Ícone pixel decorativo (o botão que o contém já tem aria-label). */
function Icon({ name }: { name: string }) {
  return <img src={`${ICON}${name}.svg`} alt="" width={22} height={22} draggable={false} />;
}

export default function MusicPlayer() {
  const player = useMusicPlayer();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const toggleRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false); // começa fechado: a montagem não rouba o foco da página

  const track = TRACKS[player.trackIndex];
  const toggleLabel = player.playing ? 'Abrir player de música lo-fi (tocando)' : 'Ligar música lo-fi';

  // Foco: ao abrir vai para o botão play; ao fechar volta para o botão "lo-fi".
  useEffect(() => {
    // Só move o foco quando "open" realmente muda. Comparar com o valor
    // anterior (em vez de "já montou?") resiste ao StrictMode, que roda
    // os efeitos duas vezes em desenvolvimento.
    if (wasOpen.current === open) return;
    wasOpen.current = open;
    if (open) {
      playRef.current?.focus();
    } else {
      // Foca o botão que está visível (celular ou desktop).
      const buttons = toggleRef.current?.querySelectorAll('button') ?? [];
      Array.from(buttons).find((b) => b.offsetParent !== null)?.focus();
    }
  }, [open]);

  // A música já começa sozinha ao abrir o site; o botão só mostra o painel.
  const handleOpen = () => setOpen(true);

  // Esc recolhe o painel (a música continua; use o botão de pausa para parar).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const anim = reduceMotion
    ? { initial: false as const, animate: {}, exit: undefined, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 8 },
        transition: { duration: 0.2 },
      };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Duas versões do botão: as classes poke-btn são CSS sem camada e vencem os
          utilitários do Tailwind, então alternamos a visibilidade por um wrapper. */}
      {!open && (
        <div ref={toggleRef}>
          <div className="sm:hidden">
            <button
              type="button"
              onClick={handleOpen}
              className="poke-btn poke-btn--icon poke-btn--blue"
              aria-label={toggleLabel}
              aria-expanded={false}
            >
              <Icon name="music" />
            </button>
          </div>
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={handleOpen}
              className="poke-btn poke-btn--sm poke-btn--blue"
              aria-label={toggleLabel}
              aria-expanded={false}
            >
              <Icon name="music" />
              <span aria-hidden="true">lo-fi</span>
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            {...anim}
            aria-label="Player de música lo-fi"
            onKeyDown={handleKeyDown}
            className="glass w-[min(18rem,calc(100vw-2rem))] rounded-xl p-3 text-text"
          >
            {player.allFailed ? (
              <p role="status" className="font-body text-sm text-dim">
                Faixas ainda não adicionadas (veja assets/music/LEIA-ME.md)
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    ref={playRef}
                    type="button"
                    onClick={player.toggle}
                    className="poke-btn poke-btn--icon poke-btn--green shrink-0"
                    aria-label={player.playing ? 'Pausar música' : 'Tocar música'}
                  >
                    <Icon name={player.playing ? 'pause' : 'play'} />
                  </button>
                  <button
                    type="button"
                    onClick={player.next}
                    className="poke-btn poke-btn--icon poke-btn--yellow shrink-0"
                    aria-label="Próxima faixa"
                  >
                    <Icon name="next" />
                  </button>
                  <div className="min-w-0 flex-1" role="status" aria-live="polite">
                    <p className="truncate font-pixel text-sm text-amber">{track.title}</p>
                    <p className="truncate font-body text-xs text-dim">
                      <a
                        href={track.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-dotted underline-offset-2 hover:text-aqua"
                      >
                        {track.artist} · CC0
                      </a>
                    </p>
                    {player.pausedByVideo && (
                      <p className="font-body text-xs text-aqua">pausada pelo vídeo</p>
                    )}
                  </div>
                </div>

                {/* A área de clique do slider tem 44px de altura; a barra visível é fina. */}
                <label className="mt-2 flex min-h-11 items-center gap-2">
                  <img
                    src={`${ICON}${player.volume === 0 ? 'mute' : 'volume'}.svg`}
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                  <span className="sr-only">Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(player.volume * 100)}
                    onChange={(e) => player.setVolume(Number(e.target.value) / 100)}
                    aria-label="Volume"
                    className="h-11 w-full cursor-pointer accent-amber"
                  />
                </label>
              </>
            )}

            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="poke-btn poke-btn--icon poke-btn--red"
                aria-label="Recolher player de música"
              >
                <Icon name="close" />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
