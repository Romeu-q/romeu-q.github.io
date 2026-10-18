import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PROFILE } from "@/data/projects";
import { icon, isExternal } from "@/lib/media";

// Itens do menu. Os que dependem de PROFILE.links somem se o link estiver vazio.
export function profileLinks() {
  const l = PROFILE.links;
  return [
    { label: "currículo", href: l.cv, icon: "cv" },
    { label: "GitHub", href: l.github, icon: "github" },
    { label: "LinkedIn", href: l.linkedin, icon: "linkedin" },
    { label: "itch.io", href: l.itch, icon: "itch" },
    { label: "e-mail", href: l.email ? `mailto:${l.email}` : "", icon: "mail" }
  ].filter((item) => item.href);
}

const NAV = [
  { label: "projetos", href: "#projetos", icon: "code" },
  { label: "sobre", href: "#oi", icon: "user" },
  ...profileLinks()
];

export function Header() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  // Esc fecha o menu mobile e devolve o foco ao botão
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const links = (onClick?: () => void) =>
    NAV.map((item) => (
      <li key={item.label}>
        <a
          href={item.href}
          onClick={onClick}
          {...(isExternal(item.href) ? { target: "_blank", rel: "noopener" } : {})}
          className="flex items-center gap-2 rounded-md px-3 py-2 font-pixel text-[0.98rem] text-text no-underline transition-colors hover:bg-white/10 hover:text-amber"
        >
          <img className="pixel" src={icon(item.icon)} alt="" width={16} height={16} />
          {item.label}
        </a>
      </li>
    ));

  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <div className="glass relative mx-auto flex max-w-[1120px] items-center justify-between gap-3 rounded-xl py-1.5 pl-3 pr-2">
        <a href="#topo" className="flex items-center gap-2.5 no-underline" aria-label="Romeu — início">
          <img className="pixel h-10 w-10" src="assets/img/pixel/logo.svg" alt="" width={40} height={40} />
          <span className="font-pixel text-xl font-bold text-text">Romeu</span>
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="m-0 flex list-none gap-0.5 p-0">{links()}</ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="poke-btn poke-btn--icon md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="font-tiny text-xs">{open ? "X" : "≡"}</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="menu-mobile"
              aria-label="Principal"
              className="glass absolute left-0 right-0 top-[calc(100%+8px)] rounded-xl p-2 md:hidden"
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ul className="m-0 flex list-none flex-col p-0">{links(() => setOpen(false))}</ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
