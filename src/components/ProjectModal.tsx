import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project, Shot } from "@/data/projects";
import { icon } from "@/lib/media";
import { LinkButtons } from "./Projects";

/** Galeria: imagem grande + miniaturas. Setas do teclado trocam de imagem. */
function Gallery({ shots }: { shots: Shot[] }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const go = (d: number) => setI((v) => (v + d + shots.length) % shots.length);
  const shot = shots[i];

  return (
    <div
      className="mb-5"
      // setas só quando o foco está dentro da galeria, para não brigar com a rolagem
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      }}
    >
      <figure className="relative m-0 overflow-hidden rounded-lg border border-line bg-black">
        <div className="relative aspect-[16/10]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              className={`absolute inset-0 h-full w-full object-contain ${shot.pixel ? "pixel" : ""}`}
              initial={reduce ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
        </div>
        {shots.length > 1 && (
          <>
            <button type="button" className="poke-btn poke-btn--icon poke-btn--sm absolute left-2 top-1/2 -translate-y-1/2" aria-label="Imagem anterior" onClick={() => go(-1)}>
              <span aria-hidden="true">◀</span>
            </button>
            <button type="button" className="poke-btn poke-btn--icon poke-btn--sm absolute right-2 top-1/2 -translate-y-1/2" aria-label="Próxima imagem" onClick={() => go(1)}>
              <span aria-hidden="true">▶</span>
            </button>
          </>
        )}
        {shot.caption && (
          <figcaption className="border-t border-line bg-night-1 px-3 py-2 text-sm text-dim" aria-live="polite">
            {shots.length > 1 && <span className="mr-2 font-tiny text-[0.55rem] text-amber">{i + 1}/{shots.length}</span>}
            {shot.caption}
          </figcaption>
        )}
      </figure>

      {shots.length > 1 && (
        <ul className="m-0 mt-2 flex list-none gap-2 overflow-x-auto p-0 pb-1" aria-label="Miniaturas">
          {shots.map((s, n) => (
            <li key={s.src} className="flex-none">
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={`Ver imagem ${n + 1}`}
                aria-current={n === i}
                className={`block h-14 w-24 cursor-pointer overflow-hidden rounded border-2 bg-black p-0 ${n === i ? "border-amber" : "border-line opacity-60 hover:opacity-100"}`}
              >
                <img className={`h-full w-full object-cover ${s.pixel ? "pixel" : ""}`} src={s.src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Modal com <dialog> nativo: showModal() já entrega foco preso,
 * Esc para fechar e o resto da página inerte — menos código para manter.
 */
export function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
  }, [project]);

  const p = project;
  return (
    <dialog
      ref={ref}
      className="project-modal m-auto"
      aria-labelledby="modal-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }} // Esc
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // clique no fundo
    >
      {p && (
        <div className="glass flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-night-1/95">
          <div className="win-titlebar">
            <span className="win-dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="flex-1 truncate">{p.kind}</span>
            <button type="button" className="poke-btn poke-btn--icon poke-btn--sm h-9 w-9 min-h-0" aria-label="Fechar" onClick={onClose}>
              <img src={icon("close")} alt="" width={16} height={16} />
            </button>
          </div>
          <div className="overflow-y-auto px-5 pb-7 pt-5 sm:px-6">
            {/* key: a galeria volta para a 1ª imagem ao trocar de projeto */}
            <Gallery key={p.id} shots={p.shots} />
            <h2 id="modal-title" className="mb-3 font-pixel text-[clamp(1.8rem,5vw,2.6rem)] font-bold leading-tight">{p.title}</h2>
            <div className="mb-5 flex flex-wrap gap-2.5">
              <LinkButtons links={p.links} size="md" />
            </div>
            {/* details vem do nosso próprio arquivo de dados (confiável) e aceita HTML simples */}
            {p.details.map((d, i) => (
              <p key={i} className="mb-3 text-dim [&_code]:text-aqua [&_strong]:text-text" dangerouslySetInnerHTML={{ __html: d }} />
            ))}
            {p.highlights.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 font-pixel text-xl font-bold">Destaques técnicos</h3>
                <ul className="mb-4 list-none p-0">
                  {p.highlights.map((h) => (
                    <li key={h} className="relative mb-1.5 pl-6 text-dim before:absolute before:left-1 before:top-[0.6em] before:h-2 before:w-2 before:bg-amber before:shadow-[2px_2px_0_#000]">
                      {h}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Tecnologias">
              {p.tags.map((t) => <li key={t} className="chip">{t}</li>)}
            </ul>
          </div>
        </div>
      )}
    </dialog>
  );
}
