import { motion, useReducedMotion } from "framer-motion";
import { icon } from "@/lib/media";
import { Reveal } from "./ui/Reveal";

// TODO: ajuste os textos com a sua voz; cite cursos/formação se quiser
const SKILLS = ["Godot 4 · GDScript", "JavaScript / TypeScript", "React", "HTML & CSS", "PHP · Laravel", "Vue", "C# · .NET", "Rust", "MySQL", "Aseprite", "Git"];

/** "Oi!" — sobre mim, numa caixa de diálogo no estilo dos jogos de Pokémon. */
export function About() {
  const reduce = useReducedMotion();
  return (
    <section id="oi" aria-labelledby="oi-title" className="mx-auto w-[min(100%-32px,1120px)] py-14">
      <Reveal>
        <div className="grid items-end gap-6 md:grid-cols-[180px_1fr]">
          <motion.img
            className="pixel mx-auto w-40 md:w-full"
            src="assets/img/pixel/mascot-wave.png"
            alt="Romeu em pixel art acenando: cabelo ondulado, óculos redondos e camiseta clara."
            {...(reduce ? {} : { animate: { y: [0, -6, 0] }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } })}
          />
          <div className="poke-dialog">
            <h2 id="oi-title" className="mb-3 font-pixel text-4xl font-bold">Oi!</h2>
            <p className="mb-3">
              Eu sou o Alisson Romeu, mas todo mundo me chama de <strong>Romeu</strong>. Moro em Feira de Santana, na Bahia, e passo boa
              parte do tempo desenhando pixel por pixel ou brigando (com carinho) com a Godot.
            </p>
            <p className="mb-3">
              Vim do <strong>suporte técnico em automação comercial</strong>: manutenção de PDVs, balanças, impressoras e do software que faz
              o caixa da padaria funcionar. Foi lá que aprendi a investigar um problema até o fim, conversar com quem está do outro lado do
              balcão e entregar algo que funciona no mundo real.
            </p>
            <p className="mb-0">
              Hoje junto isso com o que mais gosto de fazer: <strong>criar jogos e aplicações</strong>. Estou procurando minha primeira vaga
              como desenvolvedor, em web ou jogos, de preferência remota.
            </p>
            <motion.span
              className="poke-next"
              aria-hidden="true"
              {...(reduce ? {} : { animate: { y: [0, 3, 0] }, transition: { duration: 0.8, repeat: Infinity } })}
            >
              ▼
            </motion.span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-8 grid gap-5 md:grid-cols-[1fr_1fr]">
        <div className="glass rounded-xl p-5">
          <h3 className="mb-3 font-pixel text-xl font-bold">Ferramentas</h3>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Ferramentas que uso">
            {SKILLS.map((s) => <li key={s} className="chip">{s}</li>)}
          </ul>
        </div>
        <div className="glass flex items-center gap-4 rounded-xl p-5">
          <img className="pixel h-10 w-10 flex-none" src={icon("wrench")} alt="" />
          <p className="m-0 text-dim">
            <strong className="text-amber">Diferencial:</strong> hardware + software. Sei diagnosticar desde uma impressora térmica que não
            imprime até uma consulta SQL lenta.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
