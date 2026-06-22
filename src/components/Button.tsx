/**
 * The one button primitive (PRD-004 R04-8). Three variants and a guaranteed
 * ≥44×44pt touch target (`min-h-touch`/`min-w-touch`, _docs/06 §1 thumb-first).
 * Styling is entirely token-driven — no magic hex (R04-1).
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white active:brightness-95',
  secondary: 'bg-surface text-text ring-1 ring-black/10 active:brightness-95',
  ghost: 'bg-transparent text-textMuted active:text-text',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-touch min-w-touch items-center justify-center',
        'rounded-button px-6 text-body font-medium',
        'transition-[filter,color,background-color] disabled:opacity-50',
        VARIANTS[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
