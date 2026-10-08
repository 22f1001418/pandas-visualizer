interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

/**
 * Segmented control used to switch an example's variant
 * (join type, fill strategy, axis, …) and re-script the animation.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {label && <span className="seg__label">{label}</span>}
      <div className="seg" role="tablist">
        {options.map((o) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={o.value === value}
            title={o.hint}
            className={`seg__btn ${o.value === value ? "seg__btn--on" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
