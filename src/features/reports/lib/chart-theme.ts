import type { CSSProperties } from "react";

export const CHART_COLORS = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  tertiary: "var(--chart-3)",
  danger: "var(--destructive)",
} as const;

export const AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
} as const;

export const TOOLTIP_STYLE: CSSProperties = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
