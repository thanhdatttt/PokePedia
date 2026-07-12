import { cn } from "@/lib/utils";
import { getTypeIcon } from "@/lib/pokemonType";
import { PokemonType } from "@/types/pokemonType";

interface TypeBadgeProps {
  type: PokemonType;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function TypeBadge({ type, selected, onClick, size = "md" }: TypeBadgeProps) {
  const Icon = getTypeIcon(type.name);
  const isInteractive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      className={cn(
        "w-36 inline-flex items-center gap-1.5 rounded-full font-bold capitalize transition-all",
        size === "sm" ? "px-2 py-0.5 text-md" : "px-3 py-1.5 text-md",
        isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
        !isInteractive && "cursor-default",
        selected && "ring-2 ring-offset-2 ring-offset-background",
      )}
      style={{
        backgroundColor: `${type.color}1A`,
        color: type.color,
        "--tw-ring-color": type.color,
      } as React.CSSProperties}
    >
      <img src={Icon} alt={type.name} className={`${size === "sm" ? "w-10 h-12" : "w-14 h-12"}`} />
      {type.name}
    </button>
  );
}