import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { PROFILE } from "@/data/projects";
import { icon } from "@/lib/media";
import { PokeButton } from "./ui/PokeButton";

/**
 * Uma camada que se desloca proporcionalmente à "profundidade".
 * mx/my vão de -1 a 1 (posição do mouse); depth maior = move mais.
 */
function Layer({ mx, my, depth, className, children }: {
  mx: MotionValue<number>; my: MotionValue<number>; depth: number; className?: string; children: React.ReactNode;
}) {
  const x = useTransform(mx, (v) => -v * depth * 10);
  const y = useTransform(my, (v) => -v * depth * 6);
  return <motion.div style={{ x, y }} className={className}>{children}</motion.div>;
}

// Objetos flutuando fora da janela (posição, tamanho, profundidade, atraso do balanço)
const FLOATIES = [
  { src: "assets/img/pixel/floppy.svg", cls: "-left-6 -top-4 w-16", depth: 1.6, delay: 0 },
  { src: "assets/img/pixel/cd.svg", cls: "-right-3 top-[8%] w-14", depth: 1.3, delay: 0.8 },
  { src: "assets/img/pixel/crt.svg", cls: "-right-4 bottom-[20%] w-14 hidden sm:block", depth: 1.4, delay: 1.6 },
  { src: "assets/img/pixel/firefly.svg", cls: "left-[-14px] bottom-[18%] w-6", depth: 2.2, delay: 0.4 },
  { src: "assets/img/pixel/sparkle.svg", cls: "left-[-18px] top-[34%] w-7 hidden sm:block", depth: 2, delay: 1.2 }
];

export function Hero() {
  const reduce = useReducedMotion();
  // Valores brutos do mouse + mola para suavizar (sem re-render do React a cada pixel)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  useEffect(() => {
    // Só com mouse de verdade e sem pedido de menos movimento
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1);
      rawY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, rawX, rawY]);

  const bob = (delay: number) =>
    reduce ? {} : { animate: { y: [0, -10, 0], rotate: [-2, 2, -2] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <section id="topo" aria-labelledby="hero-title" className="mx-auto grid w-[min(100%-32px,1120px)] items-center gap-10 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-20">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="glass mb-4 inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-extrabold">
          <img className="pixel" src={icon("pin")} alt="" width={16} height={16} /> {PROFILE.city}
        </p>
        <h1 id="hero-title" className="mb-4 font-pixel text-[clamp(2.2rem,6vw,3.6rem)] font-bold leading-tight">
          Oi, eu sou o <span className="text-amber">Romeu</span>!
        </h1>
        <p className="mb-6 max-w-[34rem] text-dim">
          Desenvolvedor <strong className="text-text">web full stack</strong> (Laravel, Vue, React, MySQL) e de{" "}
          <strong className="text-text">jogos em Godot 4</strong>. Venho de 7+ anos em suporte de TI e automação comercial, então gosto
          de resolver problema de verdade, do banco de dados ao hardware.
        </p>
        <div className="flex flex-wrap gap-3">
          <PokeButton href="#projetos" color="red" icon={icon("gamepad")}>Ver projetos</PokeButton>
          {PROFILE.links.cv && <PokeButton href={PROFILE.links.cv} color="blue" icon={icon("cv")}>Currículo</PokeButton>}
        </div>
        <p className="mt-4 text-sm font-bold text-aqua">Procurando vaga de desenvolvedor (web ou jogos) · de preferência remota</p>
      </motion.div>

      {/* Janela com cena pixel em camadas (parallax no mouse) */}
      <div className="relative p-4">
        <div className="glass overflow-hidden rounded-xl -rotate-1">
          <div className="win-titlebar" aria-hidden="true">
            <span className="win-dots"><i /><i /><i /></span>
            <span>romeu.exe</span>
          </div>
          <div
            className="relative aspect-video overflow-hidden bg-night-1"
            role="img"
            aria-label="Cena noturna em pixel art: lua, ilhas com janelas acesas, mar e o Romeu em pixel art no primeiro plano."
          >
            {["hero-sky", "hero-far", "hero-sea", "hero-near"].map((name, i) => (
              <Layer key={name} mx={mx} my={my} depth={[0.15, 0.35, 0.6, 0.9][i]} className="absolute inset-[-4%]">
                <img className="pixel h-full w-full object-cover" src={`assets/img/pixel/${name}.svg`} alt="" />
              </Layer>
            ))}
            <Layer mx={mx} my={my} depth={1.1} className="absolute bottom-[3%] left-1/2 w-[30%] max-w-[190px] -translate-x-1/2">
              <motion.img
                className="pixel w-full drop-shadow-[0_6px_0_rgba(0,0,0,.35)]"
                src="assets/img/pixel/mascot.png"
                alt=""
                {...(reduce ? {} : { animate: { y: [0, -4, 0] }, transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } })}
              />
            </Layer>
          </div>
        </div>

        {FLOATIES.map((f) => (
          <Layer key={f.src} mx={mx} my={my} depth={f.depth} className={`absolute ${f.cls}`}>
            <motion.img
              className="pixel w-full drop-shadow-[0_12px_8px_rgba(0,0,0,.5)]"
              src={f.src}
              alt=""
              aria-hidden="true"
              {...bob(f.delay)}
            />
          </Layer>
        ))}
      </div>
    </section>
  );
}
