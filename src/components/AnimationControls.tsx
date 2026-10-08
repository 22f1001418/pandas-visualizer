import { getIcon } from "@/lib/icons";
import { useStore } from "@/store/useStore";

interface Props {
  step: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSeek: (i: number) => void;
  stepLabels?: string[];
  showSpeed?: boolean;
}

const SPEEDS: Array<{ ms: number; label: string }> = [
  { ms: 2200, label: "0.5×" },
  { ms: 1400, label: "1×" },
  { ms: 700, label: "2×" },
];

export function AnimationControls({
  step,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  onSeek,
  stepLabels,
  showSpeed = true,
}: Props) {
  const speed = useStore((s) => s.speed);
  const setSpeed = useStore((s) => s.setSpeed);

  const Play = getIcon("Play");
  const Pause = getIcon("Pause");
  const Back = getIcon("SkipBack");
  const Fwd = getIcon("SkipForward");
  const Reset = getIcon("RotateCcw");

  const currentLabel = stepLabels?.[step];

  return (
    <div className="card px-3 py-2.5 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <button className="btn btn-ghost" onClick={onReset} title="Restart" aria-label="Restart">
          <Reset size={14} />
        </button>
        <button
          className="btn btn-ghost"
          onClick={onPrev}
          disabled={step === 0}
          title="Previous step (←)"
          aria-label="Previous step"
        >
          <Back size={14} />
        </button>
        {isPlaying ? (
          <button className="btn btn-primary" onClick={onPause} aria-label="Pause">
            <Pause size={14} />
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onPlay} aria-label="Play">
            <Play size={14} />
            {step === totalSteps - 1 ? "Replay" : "Play"}
          </button>
        )}
        <button
          className="btn btn-ghost"
          onClick={onNext}
          disabled={step >= totalSteps - 1}
          title="Next step (→)"
          aria-label="Next step"
        >
          <Fwd size={14} />
        </button>
      </div>

      <div className="flex-1 min-w-[170px] flex flex-col gap-1">
        <input
          type="range"
          className="scrubber"
          min={0}
          max={Math.max(totalSteps - 1, 0)}
          value={step}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Step scrubber"
        />
        <div className="flex items-center justify-between text-[11px] text-fg-muted font-mono">
          <span>
            Step {step + 1} / {totalSteps}
          </span>
          {currentLabel && (
            <span className="text-accent truncate ml-2 max-w-[60%]">
              {currentLabel}
            </span>
          )}
        </div>
      </div>

      {showSpeed && (
        <div className="seg" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s.ms}
              className={`seg__btn ${speed === s.ms ? "seg__btn--on" : ""}`}
              onClick={() => setSpeed(s.ms)}
              title={`${s.label} speed`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
