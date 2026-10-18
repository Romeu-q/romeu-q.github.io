import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PROJECTS, type Links, type Project } from "@/data/projects";
import { announceMediaPlay, icon, isExternal } from "@/lib/media";
import { PokeButton } from "./ui/PokeButton";
import { Reveal } from "./ui/Reveal";
import { ProjectModal } from "./ProjectModal";

// Botões de link de cada projeto (cores do menu de batalha do Pokémon).
// A ordem importa: o primeiro que existir vira o botão principal do card.
const LINK_TYPES: { key: keyof Links; label: string; icon: string; color: "red" | "yellow" | "green" | "blue" }[] = [
  { key: "demo", label: "Testar ao vivo", icon: "play", color: "green" },
  { key: "download", label: "Baixar", icon: "external", color: "yellow" },
  { key: "github", label: "Código", icon: "github", color: "blue" },
  { key: "video", label: "Vídeo", icon: "video", color: "red" },
  { key: "itch", label: "itch.io", icon: "itch", color: "yellow" }
];

export function LinkButtons({ links, size = "sm" }: { links: Links; size?: "sm" | "md" }) {
  return (
    <>
      {LINK_TYPES.filter((t) => links[t.key]).map((t) => (
        <PokeButton
          key={t.key}
          href={links[t.key]}
          size={size}
          color={t.color}
          icon={icon(t.icon)}
          // demos internas também abrem em nova aba, para o avaliador não perder o portfólio
          {...(!isExternal(links[t.key]) ? { target: "_blank", rel: "noopener" } : {})}
          onClick={t.key === "video" ? announceMediaPlay : undefined}
        >
          {t.label}
        </PokeButton>
      ))}
    </>
  );
}

/** Moldura de "janela de navegador" para os prints reais. */
function BrowserFrame({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const shot = p.shots[0];
  const host = p.links.demo ? (isExternal(p.links.demo) ? new URL(p.links.demo).host : `romeu-q.github.io/${p.links.demo.replace("/index.html", "")}`) : p.title.toLowerCase();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ver imagens e detalhes de ${p.title}`}
      className="group block w-full cursor-pointer overflow-hidden rounded-lg border border-line bg-night-0 p-0 text-left shadow-[0_10px_30px_rgba(0,0,0,.45)]"
    >
      <span className="flex items-center gap-2 border-b border-line bg-night-2 px-3 py-1.5" aria-hidden="true">
        <span className="win-dots"><i /><i /><i /></span>
        <span className="truncate rounded bg-night-0/70 px-2 py-0.5 font-body text-[0.7rem] text-dim">{host}</span>
      </span>
      <span className="relative block aspect-[16/10] overflow-hidden">
        <img
          className={`h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] ${shot.pixel ? "pixel" : ""}`}
          src={shot.src}
          alt=""
          loading="lazy"
          decoding="async"
        />
        {p.shots.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-night-0/85 px-2 py-1 font-tiny text-[0.55rem] text-amber">
            {p.shots.length} imagens
          </span>
        )}
      </span>
    </button>
  );
}

function ProjectCard({ p, onOpen, index }: { p: Project; onOpen: (id: string) => void; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      id={`card-${p.id}`}
      className={`glass flex flex-col gap-5 rounded-xl p-4 sm:p-5 ${p.featured ? "col-span-full lg:flex-row lg:items-center lg:gap-8" : ""}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
    >
      <div className={p.featured ? "lg:flex-[1.25]" : ""}>
        <BrowserFrame p={p} onOpen={() => onOpen(p.id)} />
      </div>
      <div className={`flex flex-1 flex-col gap-2.5 ${p.featured ? "lg:py-2" : ""}`}>
        <p className="m-0 text-xs font-extrabold uppercase tracking-wider text-aqua">{p.kind}</p>
        <h3 className={`m-0 font-pixel font-bold leading-tight ${p.featured ? "text-4xl" : "text-2xl"}`}>{p.title}</h3>
        <p className="m-0 text-dim">{p.summary}</p>
        {p.howToTest && (
          <p className="m-0 flex gap-2 rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-text">
            <span aria-hidden="true" className="text-amber">▶</span>
            <span><strong className="text-amber">Como avaliar:</strong> {p.howToTest}</span>
          </p>
        )}
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Tecnologias">
          {p.tags.map((t) => <li key={t} className="chip">{t}</li>)}
        </ul>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <LinkButtons links={p.links} size={p.featured ? "md" : "sm"} />
          <PokeButton size={p.featured ? "md" : "sm"} icon={icon("star")} onClick={() => onOpen(p.id)}>Detalhes</PokeButton>
        </div>
      </div>
    </motion.article>
  );
}

export function Projects() {
  const [openId, setOpenId] = useState<string | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const main = PROJECTS.filter((p) => !p.demo);
  const demos = PROJECTS.filter((p) => p.demo);

  const open = useCallback((id: string, fromHash = false) => {
    if (!PROJECTS.some((p) => p.id === id)) return;
    lastFocus.current = document.activeElement as HTMLElement;
    setOpenId(id);
    // URL compartilhável: #projeto/<id>
    if (!fromHash) history.replaceState(null, "", `#projeto/${id}`);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    if (location.hash.startsWith("#projeto/")) history.replaceState(null, "", "#projetos");
    lastFocus.current?.focus?.();
  }, []);

  // Links tipo "#projeto/verity" (inclusive vindos de fora) abrem o modal direto
  useEffect(() => {
    const fromHash = () => {
      const m = location.hash.match(/^#projeto\/([\w-]+)$/);
      if (m) open(m[1], true);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [open]);

  return (
    <section id="projetos" aria-labelledby="projetos-title" className="mx-auto w-[min(100%-32px,1120px)] py-12">
      <Reveal>
        <h2 id="projetos-title" className="mb-2 flex items-center gap-3 font-pixel text-[clamp(1.8rem,4.5vw,2.6rem)] font-bold">
          <img className="pixel h-8 w-8" src={icon("star")} alt="" /> Projetos
        </h2>
        <p className="mb-8 max-w-[46rem] text-dim">Clique nas imagens para ver a galeria e os detalhes técnicos de cada projeto.</p>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-2">
        {main.map((p, i) => <ProjectCard key={p.id} p={p} index={i} onOpen={open} />)}
      </div>

      <Reveal>
        <h3 id="demos-title" className="mb-2 mt-16 font-pixel text-2xl font-bold">Sites de demonstração</h3>
        <p className="mb-6 max-w-[46rem] text-dim">
          Três mini-sites com visuais bem diferentes, feitos em HTML, CSS e JavaScript puros. Todos funcionam aqui mesmo, no navegador.
        </p>
      </Reveal>
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]" aria-labelledby="demos-title">
        {demos.map((p, i) => <ProjectCard key={p.id} p={p} index={i} onOpen={open} />)}
      </div>

      <ProjectModal project={PROJECTS.find((p) => p.id === openId) ?? null} onClose={close} />
    </section>
  );
}
