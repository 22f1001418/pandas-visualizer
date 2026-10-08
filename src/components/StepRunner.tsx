import { Fragment, useEffect, useMemo, type ReactNode } from "react";
import { getIcon } from "@/lib/icons";
import { useStepAnimation } from "@/hooks/useStepAnimation";
import { useStore } from "@/store/useStore";
import { AnimationControls } from "./AnimationControls";
import { CodeCell } from "./CodeCell";
import { DataFrameView } from "./DataFrameView";
import { Inspector } from "./Inspector";
import type { Step } from "@/types";

interface Props {
  /** Stable id — the animation resets when it changes (e.g. variant switch). */
  runId: string;
  /** Full source listing shown in the code cell. */
  code: string;
  steps: Step[];
  /** Optional caption above the code cell. */
  caption?: string;
  /** Variant pickers etc., rendered above the code cell. */
  controls?: ReactNode;
  /** Key namespace so two runners on a page animate independently. */
  layoutId?: string;
  /** Bind ← / → / space. Turn off for the second runner on a page. */
  keyboard?: boolean;
  /** Execution counter shown in the In[n]/Out[n] gutter. */
  cellNumber?: number;
}

/**
 * The heart of every lesson page.
 *
 *   ┌─────────────────────────────┐  ┌────────────────────┐
 *   │ In [1]:  code listing       │  │                    │
 *   ├─────────────────────────────┤  │     Inspector       │
 *   │ Out[1]:  frames for step    │  │   (what & why for   │
 *   ├─────────────────────────────┤  │    this step)       │
 *   │ step rail + playback        │  │                    │
 *   └─────────────────────────────┘  └────────────────────┘
 */
export function StepRunner({
  runId,
  code,
  steps,
  caption,
  controls,
  layoutId = "dfl",
  keyboard = true,
  cellNumber = 1,
}: Props) {
  const speed = useStore((s) => s.speed);
  const { step, isPlaying, play, pause, next, prev, reset, goTo } =
    useStepAnimation({
      totalSteps: steps.length,
      resetKey: runId,
      interval: speed,
    });

  const current = steps[Math.min(step, steps.length - 1)] ?? steps[0];
  const stepLabels = useMemo(() => steps.map((s) => s.label), [steps]);
  const Dot = getIcon("Circle");

  // Keyboard scrubbing. Ignored while typing in a field.
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (useStore.getState().paletteOpen) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === " ") {
        e.preventDefault();
        isPlaying ? pause() : play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, next, prev, play, pause, isPlaying]);

  const multi = current.views.length > 1;

  return (
    <section className="flex flex-col gap-3">
      {(caption || controls) && (
        <div className="flex items-end justify-between gap-3 flex-wrap">
          {caption && <h2 className="section-title !pb-0">{caption}</h2>}
          {controls && <div className="ml-auto">{controls}</div>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
        <div className="flex flex-col gap-3 min-w-0">
          <CodeCell
            code={code}
            count={cellNumber}
            kind="in"
            activeLines={current.lines}
            active
          />

          <div className="nb-cell nb-cell--output">
            <div className="nb-cell__gutter nb-cell__prompt-out">
              Out[{cellNumber}]:
            </div>
            <div className="nb-cell__body flex flex-col gap-4">
              <div
                className={`grid gap-4 items-start ${
                  multi ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {current.views.map((v, i) => (
                  <Fragment key={`${layoutId}-view-${i}`}>
                    {v.arrow && (
                      <div className="flow-arrow xl:col-span-2">
                        <span>{v.arrow}</span>
                      </div>
                    )}
                    <DataFrameView
                      frame={v.frame}
                      title={v.title}
                      badge={v.badge}
                      highlights={v.highlights}
                      note={v.note}
                      series={v.series}
                      dtypes={v.dtypes}
                      muted={v.muted}
                      layoutId={`${layoutId}-${i}`}
                      maxHeight={440}
                    />
                  </Fragment>
                ))}
              </div>

              {current.outputs && current.outputs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {current.outputs.map((o) => (
                    <span
                      key={o.label}
                      className={`result-chip result-chip--${o.tone ?? "accent"}`}
                    >
                      <span className="result-chip__label">{o.label}</span>
                      <span className="result-chip__value">{o.value}</span>
                    </span>
                  ))}
                </div>
              )}

              {current.stdout && <pre className="stdout">{current.stdout}</pre>}
            </div>
          </div>

          {/* Step rail — click any step to jump straight to it. */}
          <div className="step-rail" role="tablist" aria-label="Steps">
            {steps.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === step}
                className={`step-rail__item ${
                  i === step
                    ? "step-rail__item--on"
                    : i < step
                      ? "step-rail__item--done"
                      : ""
                }`}
                onClick={() => goTo(i)}
                title={s.label}
              >
                <Dot size={7} strokeWidth={6} />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>

          <AnimationControls
            step={step}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            onPlay={play}
            onPause={pause}
            onNext={next}
            onPrev={prev}
            onReset={reset}
            onSeek={goTo}
            stepLabels={stepLabels}
          />
        </div>

        <div className="lg:sticky lg:top-4 self-start w-full">
          <Inspector
            explain={current.explain}
            variables={current.variables}
            stepLabel={current.label}
            code={current.code}
            progress={(step + 1) / steps.length}
          />
        </div>
      </div>
    </section>
  );
}
