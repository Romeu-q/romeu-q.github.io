import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isExternal } from "@/lib/media";

type Color = "red" | "yellow" | "green" | "blue";

type Common = {
  color?: Color;
  size?: "md" | "sm";
  iconOnly?: boolean;
  icon?: string; // caminho de um ícone pixel 16x16
  children?: ReactNode;
  className?: string;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">;

/**
 * Botão no estilo dos menus de Pokémon (caixa creme, borda escura, aro
 * colorido e setinha ▶ no hover/foco — o visual está em index.css).
 * Vira <a> quando recebe href e <button> nos outros casos, para manter a
 * semântica certa: link navega, botão executa ação.
 */
export function PokeButton(props: AsLink | AsButton) {
  const { color, size = "md", iconOnly, icon, children, className, ...rest } = props;
  const cls = cn(
    "poke-btn",
    color && `poke-btn--${color}`,
    size === "sm" && "poke-btn--sm",
    iconOnly && "poke-btn--icon",
    className
  );
  const content = (
    <>
      {icon && <img src={icon} alt="" width={16} height={16} />}
      {children}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...a } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    const ext = isExternal(href);
    return (
      <a className={cls} href={href} {...(ext ? { target: "_blank", rel: "noopener" } : {})} {...a}>
        {content}
        {ext && !iconOnly && <span className="sr-only"> (abre em nova aba)</span>}
      </a>
    );
  }
  const b = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={cls} {...b}>
      {content}
    </button>
  );
}
