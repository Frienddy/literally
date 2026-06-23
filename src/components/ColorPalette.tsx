/**
 * ColorPalette — the fixed pixel-art swatch picker (PRD-003).
 *
 * A small radiogroup of preset colors (the swatches are data in `config.palette`,
 * ADR-007 / "tunables live in config"). Tapping one selects the color the canvas
 * paints with; the active swatch carries a ring + check so the choice never relies
 * on color alone (a11y — meaning is never color-only, mirroring `RatingScale`).
 *
 * It's a controlled component: the hosting screen owns the selected hex and feeds
 * it both here and to `useCanvas({ color })`.
 */
import { config } from '../config';
import { strings } from '../content/strings';

export interface ColorPaletteProps {
  /** Currently selected color (hex). */
  selected: string;
  /** Called with the chosen color's hex. */
  onSelect: (hex: string) => void;
  className?: string;
}

export function ColorPalette({
  selected,
  onSelect,
  className = '',
}: ColorPaletteProps) {
  return (
    <div
      role="radiogroup"
      aria-label={strings.palette.label}
      data-testid="color-palette"
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
    >
      {config.palette.map((c) => {
        const active = c.hex.toLowerCase() === selected.toLowerCase();
        return (
          <button
            key={c.hex}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={strings.palette.swatchAria(c.name)}
            title={c.name}
            data-testid={`color-${c.name}`}
            data-color={c.hex}
            onClick={() => onSelect(c.hex)}
            style={{ backgroundColor: c.hex }}
            className={
              'grid h-9 w-9 place-items-center rounded-lg border text-sm transition ' +
              (active
                ? 'scale-110 border-text ring-2 ring-primary ring-offset-2 ring-offset-surface'
                : 'border-black/10 active:scale-95')
            }
          >
            {/* A non-color cue for the active swatch. The check is mid-grey-safe:
                a dark check on light swatches, drop-shadowed so it reads on dark
                ones too. */}
            {active && (
              <span
                aria-hidden
                className="text-text [text-shadow:0_0_2px_rgba(255,255,255,0.9)]"
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
