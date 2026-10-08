/**
 * Core types shared across the visualizer.
 *
 * We model a DataFrame as a lightweight JS object, not a real pandas DF —
 * just enough structure to render, animate, and explain operations.
 */

export type CellValue = number | string | boolean | null;

export type Dtype =
  | "int64"
  | "float64"
  | "object"
  | "bool"
  | "datetime64"
  | "timedelta64"
  | "category";

export interface Column {
  name: string;
  dtype: Dtype;
}

export interface DataFrame {
  /** Column schema (ordered). */
  columns: Column[];
  /** Row index labels (usually numeric, can be strings). */
  index: (number | string)[];
  /**
   * Row-major data. `data[i][j]` = value at index[i], columns[j].
   * Using arrays (not objects) keeps column order + supports null/NaN cleanly.
   */
  data: CellValue[][];
  /** Optional name for the index column (shown in the corner cell). */
  indexName?: string;
  /** Optional name for the column axis (pivot results have one). */
  columnsName?: string;
}

/**
 * Highlight codes understood by <DataFrameView />.
 *
 * Keep in sync with the .df-hl-* classes in index.css.
 */
export type HighlightKind =
  | "none"
  | "match"
  | "drop"
  | "new"
  | "changed"
  | "null"
  | "key"
  | "dim"
  | "mask-true"
  | "mask-false"
  | "group-a"
  | "group-b"
  | "group-c"
  | "group-d"
  | "group-e"
  | "heat-0"
  | "heat-1"
  | "heat-2"
  | "heat-3"
  | "heat-4";

/**
 * Map of "r:c" -> highlight kind. Sparse; missing keys default to "none".
 * Also supports whole-row (`r:*`) and whole-column (`*:c`) wildcards.
 */
export type HighlightMap = Record<string, HighlightKind>;

export interface FrameView {
  /** The frame to render at this step. */
  frame: DataFrame;
  /** Optional title above the frame (usually the expression that produced it). */
  title?: string;
  /** Cell-level highlights. */
  highlights?: HighlightMap;
  /** Optional note rendered under the frame. */
  note?: string;
  /** Optional badge/chip shown next to title. */
  badge?: string;
  /** Render with Series chrome: no column header band, dtype footer. */
  series?: boolean;
  /** Append a pandas-style dtype row under the table. */
  dtypes?: boolean;
  /** Fade the frame back — used for "before" panels. */
  muted?: boolean;
  /** Connector label drawn before this view (e.g. "merge on user_id"). */
  arrow?: string;
}

export type Tone = "accent" | "pink" | "success" | "warning" | "danger" | "info";

export interface OutputChip {
  label: string;
  value: string;
  tone?: Tone;
}

/**
 * A single step in a visualized operation.
 *
 * The step holds (a) the code line being executed, (b) one or more frame views
 * to show side-by-side (e.g. input + intermediate + output), and (c) a textual
 * explanation rendered in the inspector panel.
 */
export interface Step {
  id: string;
  /** Short title shown in the step timeline. */
  label: string;
  /** Code line(s) this step corresponds to — shown in the inspector. */
  code?: string;
  /**
   * 0-based line numbers in the page's code listing to highlight while this
   * step is active. A range is just every line in it.
   */
  lines?: number[];
  /** Frames displayed at this step. */
  views: FrameView[];
  /** Plain-language explanation. */
  explain?: string;
  /** Variables to show in the inspector panel. */
  variables?: VariableSnapshot[];
  /** Scalar results shown as chips under the frames. */
  outputs?: OutputChip[];
  /** Printed (monospace) output, e.g. what `df.info()` writes to stdout. */
  stdout?: string;
}

export interface VariableSnapshot {
  name: string;
  type: string;
  preview: string;
}

export interface QuizItem {
  q: string;
  options: string[];
  /** 0-based index of the correct option. */
  answer: number;
  /** Shown after answering, right or wrong. */
  why: string;
}

export interface PageMeta {
  id: string;
  title: string;
  /** Short label for the sidebar (falls back to title). */
  short?: string;
  blurb: string;
  icon: string; // key into lib/icons.ts
  /** Keywords for the command palette. */
  keywords?: string;
  /** Structured context shown under the page title. */
  context: {
    what: string;
    why: string;
    how: string;
  };
  /** API surface covered, rendered as monospace chips. */
  api?: string[];
  /** Takeaways listed at the bottom of the lesson. */
  keyPoints?: string[];
  /** The classic mistake for this topic. */
  gotcha?: string;
  /** Deep link into the official pandas docs. */
  docs?: string;
  /** Self-check questions. */
  quiz?: QuizItem[];
}
