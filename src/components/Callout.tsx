import type { ReactNode } from "react";
import { getIcon } from "@/lib/icons";
import type { Tone } from "@/types";

interface Props {
  tone?: Tone;
  icon?: string;
  label: string;
  children: ReactNode;
}

/**
 * A labelled note box — used for gotchas, tips and warnings.
 * Tone drives the accent colour via CSS custom properties.
 */
export function Callout({ tone = "warning", icon, label, children }: Props) {
  const Icon = getIcon(icon ?? (tone === "warning" ? "AlertTriangle" : "Lightbulb"));
  return (
    <div className={`callout callout--${tone}`}>
      <div className="callout__icon">
        <Icon size={15} strokeWidth={2.2} />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="callout__label">{label}</span>
        <div className="callout__body">{children}</div>
      </div>
    </div>
  );
}
