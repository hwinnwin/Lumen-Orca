/**
 * Lumen Design Tokens
 * Precision instrument aesthetic - luminous dark with mint, sage, amber accents
 */

export const colors = {
  background: "#0B0C0E",
  primary: "#C7F9CC",
  secondary: "#81B29A",
  accent: "#FFD166",
  surface: "rgba(199, 249, 204, 0.05)",
  border: "rgba(199, 249, 204, 0.2)"
} as const;

export const typography = {
  ui: "Inter, system-ui, sans-serif",
  code: '"JetBrains Mono", ui-monospace, monospace'
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  xxl: "3rem"
} as const;
