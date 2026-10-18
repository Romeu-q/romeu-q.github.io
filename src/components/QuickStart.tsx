import { motion, useReducedMotion } from "framer-motion";
import { PROFILE, PROJECTS } from "@/data/projects";
import { icon, isExternal } from "@/lib/media";
import { Reveal } from "./ui/Reveal";

/**
 * "Avalie em 2 minutos": atalhos para quem está avaliando (RH / tech lead)
 * chegar direto no que importa, sem precisar rolar a página inteira.
 */
export function QuickStart() {
  const reduce = useReducedMotion();
  const delivery = PROJECTS.find((p) => p.id === "delivery-ia")!;
  const verity = PROJECTS.find((p) => p.id === "verity")!;

  const tiles = [
    {
      step: "1",
      title: "Teste um projeto no ar",
      text: "delivery-ia: pergunte sobre vendas e a IA responde com dados reais e gráficos.",
      href: delivery.links.demo,
      cta: "Abrir demo ao vivo",
      img: delivery.shots[0].src,
      pixel: false
    },
    {
      step: "2",
      title: "Veja meu jogo rodando",
      text: "Verity: jogo autoral em Godot 4, com gameplay e cutscenes em pixel art.",
      href: "#projeto/verity",
      cta: "Ver galeria do Verity",
      img: verity.shots[0].src,
      pixel: true
    },
    {
      step: "3",
      title: "Leia o código",
      text: "Repositórios públicos com README, testes e decisões de arquitetura documentadas.",
      href: PROFILE.links.github,
      cta: "Abrir GitHub",
      img: "assets/img/projetos/dashboard.webp",
      pixel: false
    }
  ];

  return (
    <section aria-labelledby="quick-title" className="mx-auto w-[min(100%-32px,1120px)] pb-6">
      <Reveal>
        <h2 id="quick-title" className="mb-5 flex items-center gap-3 font-pixel text-2xl font-bold">
          <span className="rounded bg-amber px-2 py-1 font-tiny text-[0.6rem] text-ink">2 MIN</span>
          Avalie em 2 minutos
        </h2>
      </Reveal>
      <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-3">
        {tiles.map((t, n) => (
          <motion.li
            key={t.step}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: n * 0.08 }}
          >
            <a
              href={t.href}
              {...(isExternal(t.href) ? { target: "_blank", rel: "noopener" } : {})}
              className="glass group flex h-full flex-col overflow-hidden rounded-xl text-text no-underline transition-transform hover:-translate-y-1"
            >
              <span className="relative block aspect-[16/9] overflow-hidden border-b border-line">
                <img
                  className={`h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${t.pixel ? "pixel" : ""}`}
                  src={t.img}
                  alt=""
                  loading="lazy"
                />
                <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded border-2 border-ink bg-cream font-tiny text-xs text-ink">{t.step}</span>
              </span>
              <span className="flex flex-1 flex-col gap-1.5 p-4">
                <span className="font-pixel text-lg font-bold">{t.title}</span>
                <span className="text-sm text-dim">{t.text}</span>
                <span className="mt-auto flex items-center gap-2 pt-2 font-pixel text-sm font-bold text-amber">
                  <img className="pixel" src={icon(isExternal(t.href) ? "external" : "star")} alt="" width={16} height={16} />
                  {t.cta}
                  {isExternal(t.href) && <span className="sr-only"> (abre em nova aba)</span>}
                </span>
              </span>
            </a>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
