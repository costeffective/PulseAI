import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string | null;
  hasOtherFilters?: boolean;
  onSelect: (category: string | null) => void;
}

export function FilterChips({
  categories,
  selectedCategory,
  hasOtherFilters = false,
  onSelect,
}: FilterChipsProps) {
  const chips = ["All", ...categories];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Category</span>
      {chips.map((chip) => {
        const isAll = chip === "All";
        const isActive = isAll
          ? selectedCategory === null && !hasOtherFilters
          : selectedCategory === chip;

        return (
          <button key={chip} type="button" onClick={() => onSelect(isAll ? null : chip)}>
            <Badge
              variant={isActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3.5 py-1.5 text-xs leading-5 transition-colors",
                !isActive && "bg-background hover:bg-muted",
              )}
            >
              {chip}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
