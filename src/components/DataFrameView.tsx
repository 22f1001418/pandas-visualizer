import { AnimatePresence, motion } from "framer-motion";
import type { Column, DataFrame, HighlightKind, HighlightMap } from "@/types";
import { formatCell, isStringCol, shapeOf } from "@/lib/dataframe";

interface Props {
  frame: DataFrame;
  title?: string;
  badge?: string;
  highlights?: HighlightMap;
  note?: string;
  /** Series chrome: dashed accent frame, dtype footer, name caption. */
  series?: boolean;
  /** Append a pandas-style dtype row under the table. */
  dtypes?: boolean;
  /** Fade the whole frame back (for "before" panels). */
  muted?: boolean;
  /** Show the "n rows × m columns" caption pandas prints under wide reprs. */
  showShape?: boolean;
  /** Key namespace, so two frames in one step animate independently. */
  layoutId?: string;
  /** Max height before the body scrolls. */
  maxHeight?: number;
}

const HL_CLASS: Record<HighlightKind, string> = {
  none: "",
  match: "df-hl-match",
  drop: "df-hl-drop",
  new: "df-hl-new",
  changed: "df-hl-changed",
  null: "df-hl-null",
  key: "df-hl-key",
  dim: "df-hl-dim",
  "mask-true": "df-hl-mask-true",
  "mask-false": "df-hl-mask-false",
  "group-a": "df-hl-group-a",
  "group-b": "df-hl-group-b",
  "group-c": "df-hl-group-c",
  "group-d": "df-hl-group-d",
  "group-e": "df-hl-group-e",
  "heat-0": "df-heat-0",
  "heat-1": "df-heat-1",
  "heat-2": "df-heat-2",
  "heat-3": "df-heat-3",
  "heat-4": "df-heat-4",
};

const hlClass = (k?: HighlightKind): string => (k ? HL_CLASS[k] : "");

/** Exact cell wins, then the row wildcard, then the column wildcard. */
const resolveHighlight = (
  map: HighlightMap | undefined,
  r: number,
  c: number,
): HighlightKind | undefined =>
  map ? (map[`${r}:${c}`] ?? map[`${r}:*`] ?? map[`*:${c}`]) : undefined;

/**
 * Row keys must be stable across steps for the FLIP animation to track a row
 * as it moves, but index labels are not guaranteed unique (concat duplicates
 * them). Disambiguate by occurrence so both properties hold.
 */
function uniqueKeys(labels: Array<string | number>): string[] {
  const seen = new Map<string, number>();
  return labels.map((label) => {
    const k = String(label);
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return n === 0 ? k : `${k}#${n}`;
  });
}

export function DataFrameView({
  frame,
  title,
  badge,
  highlights,
  note,
  series = false,
  dtypes = false,
  muted = false,
  showShape = false,
  layoutId = "df",
  maxHeight,
}: Props) {
  const keys = uniqueKeys(frame.index);
  // Column names are not guaranteed unique either — concat(axis=1) duplicates
  // them — so the same disambiguation applies to the header and cell keys.
  const cols = uniqueKeys(frame.columns.map((c) => c.name));
  const cornerLabel = frame.indexName ?? (series ? "" : "");

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {(title || badge) && (
        <div className="flex items-center gap-2 px-1 flex-wrap">
          {title && <span className="df-title">{title}</span>}
          {badge && <span className="chip chip-accent">{badge}</span>}
        </div>
      )}

      <div
        className={`card overflow-auto ${series ? "df-wrap--series" : ""} ${
          muted ? "df-wrap--muted" : ""
        }`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className="df-header df-header--corner">
                {cornerLabel || " "}
              </th>
              <AnimatePresence initial={false}>
                {frame.columns.map((c, ci) => (
                  <motion.th
                    key={`${layoutId}-h-${cols[ci]}`}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`df-header ${isStringCol(c) ? "df-header-str" : ""}`}
                  >
                    {c.name}
                  </motion.th>
                ))}
              </AnimatePresence>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {frame.data.map((row, r) => (
                <motion.tr
                  key={`${layoutId}-row-${keys[r]}`}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="df-row-hover"
                >
                  <td className="df-index">{String(frame.index[r])}</td>
                  {row.map((v, c) => {
                    const column: Column = frame.columns[c];
                    const hl = resolveHighlight(highlights, r, c);
                    return (
                      <motion.td
                        key={`${layoutId}-${keys[r]}-${cols[c]}`}
                        layout="position"
                        className={`df-cell ${
                          isStringCol(column) ? "df-cell-str" : ""
                        } ${hlClass(hl)}`}
                      >
                        {formatCell(v, column.dtype)}
                      </motion.td>
                    );
                  })}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>

          {(dtypes || series) && (
            <tfoot>
              <tr>
                <td className="df-dtype df-dtype--corner">dtype</td>
                {frame.columns.map((c, ci) => (
                  <td key={`${layoutId}-d-${c.name}`} className="df-dtype">
                    {c.dtype}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {(note || showShape) && (
        <div className="flex flex-col gap-1 px-1">
          {showShape && (
            <p className="text-[11px] font-mono text-fg-subtle">
              [{shapeOf(frame)}]
            </p>
          )}
          {note && <p className="df-note">{note}</p>}
        </div>
      )}
    </div>
  );
}
