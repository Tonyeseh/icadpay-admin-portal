import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionCatalogItem } from "@/lib/admin-catalog-api";
import { cn } from "@/lib/utils";

export function RolePermissionPicker({
  catalog,
  selected,
  onChange,
  disabled = false,
}: {
  catalog: PermissionCatalogItem[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}) {
  if (catalog.length === 0) {
    return <p className="p-3 text-sm text-muted-foreground">No permissions in the catalog.</p>;
  }

  return (
    <div className="max-h-72 overflow-y-auto p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {catalog.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-2.5 py-2",
              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-muted/30",
            )}
          >
            <Checkbox
              className="mt-0.5"
              checked={selected.has(item.id)}
              disabled={disabled}
              onCheckedChange={(checked) => {
                if (disabled) return;
                const next = new Set(selected);
                if (checked === true) next.add(item.id);
                else next.delete(item.id);
                onChange(next);
              }}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.code}</div>
              {item.description ? (
                <div className="text-xs text-muted-foreground">{item.description}</div>
              ) : null}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
