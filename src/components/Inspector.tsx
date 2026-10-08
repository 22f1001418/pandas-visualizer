import { motion } from "framer-motion";
import { getIcon } from "@/lib/icons";
import type { VariableSnapshot } from "@/types";

interface Props {
  variables?: VariableSnapshot[];
  explain?: string;
  stepLabel?: string;
  /** The single expression this step runs. */
  code?: string;
  /** 0–1, drives the little progress bar. */
  progress?: number;
}

/**
 * The right rail, in the role of a debugger's Variables pane: what this step
 * is doing, the expression that does it, and the state of the locals.
 */
export function Inspector({
  variables,
  explain,
  stepLabel,
  code,
  progress = 0,
}: Props) {
  const Info = getIcon("Info");
  const Chevron = getIcon("ChevronRight");

  return (
    <div className="card p-4 flex flex-col gap-3 min-h-[220px]">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Info size={14} className="text-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          Inspector
        </span>
        {stepLabel && (
          <span className="ml-auto chip chip-accent">{stepLabel}</span>
        )}
      </div>

      <div className="inspector__progress" aria-hidden>
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {/* Keyed so the panel re-enters on every step change. Deliberately no
          AnimatePresence: with mode="wait", a key change arriving mid-exit
          (switching an example's variant while stepping) could leave the panel
          blank. An enter-only animation cannot get stuck. */}
      <motion.div
        key={stepLabel ?? "default"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col gap-3"
      >
        {code && <code className="inspector__code">{code}</code>}

        {explain && (
          <p className="text-[13px] leading-relaxed text-fg">{explain}</p>
        )}

        {variables && variables.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">
              Variables
            </div>
            <div className="flex flex-col gap-1.5">
              {variables.map((v) => (
                <div key={v.name} className="inspector__var">
                  <Chevron size={12} className="text-fg-subtle shrink-0" />
                  <span className="font-mono text-[12px] font-semibold text-pink truncate">
                    {v.name}
                  </span>
                  <span className="font-mono text-[10px] text-fg-subtle shrink-0">
                    {v.type}
                  </span>
                  <span className="ml-auto font-mono text-[11.5px] text-fg truncate max-w-[55%]">
                    {v.preview}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
