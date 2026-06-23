/**
 * Mode 2 numbered-color picker (PRD-006, ADR-015).
 *
 * The palette the player picks from, with every color shown by its **number**
 * (1-based) + name — so the coordinate-based step ("…with color 5 (yellow)") names a
 * swatch the player then selects themselves before filling. Unlike Mode 1's free
 * `ColorPalette`, the colors carry visible numbers so the literal instruction is
 * unambiguous; like it, this is a controlled radiogroup and the active swatch
 * carries a ring + bold number so the choice never relies on color alone (a11y).
 *
 * The number + name carry the meaning (never color alone); the swatch is decorative.
 * Colors are data in `config.palette` (ADR-007).
 */
import { config } from '../config';
import { strings } from '../content/strings';

export interface ColorLegendProps {
  /** Currently selected color (hex) — the color the canvas paints with. */
  selected: string;
  /** Called with the chosen color's hex. */
  onSelect: (hex: string) => void;
  className?: string;
}

export function ColorLegend({
  selected,
  onSelect,
  className = '',
}: ColorLegendProps) {
  return (
    <div
      role="radiogroup"
      aria-label={strings.mode2.legendLabel}
      data-testid="mode2-color-legend"
      className={`flex flex-wrap items-start justify-center gap-x-2 gap-y-1 ${className}`}
    >
      {config.palette.map((c, i) => {
        const n = i + 1;
        const active = c.hex.toLowerCase() === selected.toLowerCase();
        return (
          <button
            key={c.hex}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={strings.mode2.legendSwatchAria(n, c.name)}
            data-testid={`legend-color-${n}`}
            data-color={c.hex}
            title={`${n} · ${c.name}`}
            onClick={() => onSelect(c.hex)}
            className="flex w-8 flex-col items-center gap-0.5 rounded-md p-0.5 transition active:scale-95"
          >
            <span
              aria-hidden
              style={{ backgroundColor: c.hex }}
              className={
                'h-6 w-6 rounded-md border transition ' +
                (active
                  ? 'scale-110 border-text ring-2 ring-primary ring-offset-1 ring-offset-surface'
                  : 'border-black/10')
              }
            />
            <span
              aria-hidden
              className={
                'text-[11px] leading-none tabular-nums ' +
                (active ? 'font-bold text-text' : 'text-textMuted')
              }
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
