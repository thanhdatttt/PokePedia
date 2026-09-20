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
        "inline-flex w-32 items-center justify-center gap-1.5 rounded-full font-bold capitalize shadow-sm transition-all",
        size === "sm" ? "px-2 py-0.5 text-lg" : "px-3 py-1.5 text-lg",
        isInteractive && "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95",
        !isInteractive && "cursor-default",
        selected && "ring-2 ring-offset-2 ring-offset-background",
      )}
      style={{
        backgroundColor: `${type.color}1A`,
        color: type.color,
        "--tw-ring-color": type.color,
      } as React.CSSProperties}
    >
      <img src={Icon} alt={type.name} className={size === "sm" ? "size-4" : "size-5"} />
      {type.name}
    </button>
  );
}