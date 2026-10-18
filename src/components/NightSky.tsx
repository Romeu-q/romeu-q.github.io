import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Fundo decorativo: estrelas piscando, vaga-lumes subindo e nuvens lentas.
 * Posições sorteadas uma vez (useMemo) para não mudarem a cada render.
 */
export function NightSky() {
  const reduce = useReducedMotion();
  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  const stars = useMemo(() => Array.from({ length: 40 }, () => ({ x: rand(0, 100), y: rand(0, 100), s: rand(1, 3), d: rand(2, 5) })), []);
  const flies = useMemo(() => Array.from({ length: 12 }, () => ({ x: rand(0, 100), d: rand(14, 26), delay: -rand(0, 26), sway: rand(-40, 40) })), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {stars.map((s, i) => (
        <motion.span
          key={`s${i}`}
          className="absolute bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
          {...(reduce ? { initial: { opacity: 0.5 } } : { animate: { opacity: [0.15, 0.8, 0.15] }, transition: { duration: s.d, repeat: Infinity } })}
        />
      ))}

      <img className="pixel absolute right-[30%] top-[6%] w-44 opacity-50" src="assets/img/pixel/cloud-1.svg" alt="" />
      <img className="pixel absolute right-[8%] top-[46%] w-28 opacity-40" src="assets/img/pixel/cloud-2.svg" alt="" />

      {!reduce &&
        flies.map((f, i) => (
          <motion.img
            key={`f${i}`}
            className="pixel absolute bottom-[-20px] w-3"
            style={{ left: `${f.x}%` }}
            src="assets/img/pixel/firefly.svg"
            alt=""
            animate={{ y: [0, "-60vh", "-115vh"], x: [0, f.sway, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: f.d, repeat: Infinity, delay: f.delay, ease: "linear" }}
          />
        ))}
    </div>
  );
}
