import { icon } from "@/lib/media";
import { profileLinks } from "./Header";
import { PokeButton } from "./ui/PokeButton";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-night-0/80 pb-24 pt-10 text-center">
      <p className="mb-5 font-pixel text-3xl font-bold">Vamos conversar?</p>
      <ul className="m-0 mb-6 flex list-none flex-wrap justify-center gap-3 p-0">
        {profileLinks().map((l) => (
          <li key={l.label}>
            <PokeButton href={l.href} iconOnly aria-label={l.label}>
              <img src={icon(l.icon)} alt="" width={22} height={22} />
            </PokeButton>
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-dim">
        Feito por Romeu com React e Framer Motion © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
