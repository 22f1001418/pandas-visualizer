import type { CellValue, Column, DataFrame, Dtype, HighlightMap } from "@/types";

/* =======================================================================
   Builders
   ======================================================================= */

/**
 * Build a DataFrame from column-oriented input (friendlier to write).
 *
 * @example
 * df({ name: ["Aarav", "Priya"], score: [91, 88] });
 */
export function df(
  cols: Record<string, CellValue[]>,
  opts?: {
    index?: (number | string)[];
    dtypes?: Record<string, Dtype>;
    indexName?: string;
    columnsName?: string;
  },
): DataFrame {
  const names = Object.keys(cols);
  const rowCount = names.length ? (cols[names[0]]?.length ?? 0) : 0;

  const columns: Column[] = names.map((n) => ({
    name: n,
    dtype: opts?.dtypes?.[n] ?? inferDtype(cols[n]),
  }));

  const data: CellValue[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row: CellValue[] = [];
    for (const n of names) row.push(cols[n][r]);
    data.push(row);
  }

  const index = opts?.index ?? Array.from({ length: rowCount }, (_, i) => i);

  return {
    columns,
    index,
    data,
    indexName: opts?.indexName,
    columnsName: opts?.columnsName,
  };
}

/**
 * Build a DataFrame from row-oriented input — handy when you are transcribing
 * a printed pandas repr, where you read across rows, not down columns.
 */
export function rows(spec: {
  columns: string[];
  data: CellValue[][];
  index?: (number | string)[];
  dtypes?: Record<string, Dtype>;
  indexName?: string;
  columnsName?: string;
}): DataFrame {
  const columns: Column[] = spec.columns.map((n, c) => ({
    name: n,
    dtype: spec.dtypes?.[n] ?? inferDtype(spec.data.map((row) => row[c])),
  }));
  return {
    columns,
    index: spec.index ?? spec.data.map((_, i) => i),
    data: spec.data.map((r) => [...r]),
    indexName: spec.indexName,
    columnsName: spec.columnsName,
  };
}

/**
 * A one-column frame, rendered with Series chrome by <DataFrameView series />.
 */
export function series(
  name: string,
  values: CellValue[],
  opts?: { index?: (number | string)[]; dtype?: Dtype; indexName?: string },
): DataFrame {
  return df(
    { [name]: values },
    {
      index: opts?.index,
      dtypes: opts?.dtype ? { [name]: opts.dtype } : undefined,
      indexName: opts?.indexName,
    },
  );
}

export function inferDtype(values: CellValue[]): Dtype {
  let hasFloat = false;
  let hasInt = false;
  let hasString = false;
  let hasBool = false;
  let hasNull = false;

  for (const v of values) {
    if (v === null || v === undefined) {
      hasNull = true;
      continue;
    }
    if (typeof v === "boolean") hasBool = true;
    else if (typeof v === "number") {
      if (Number.isInteger(v)) hasInt = true;
      else hasFloat = true;
    } else if (typeof v === "string") hasString = true;
  }
  if (hasString) return "object";
  if (hasFloat) return "float64";
  // A missing value forces an integer column up to float64 — a real pandas rule
  // worth being accurate about, since the dtype footer teaches it.
  if (hasInt) return hasNull ? "float64" : "int64";
  if (hasBool) return hasNull ? "object" : "bool";
  return "object";
}

export function cloneFrame(f: DataFrame): DataFrame {
  return {
    ...f,
    columns: f.columns.map((c) => ({ ...c })),
    index: [...f.index],
    data: f.data.map((r) => [...r]),
  };
}

/* =======================================================================
   Accessors
   ======================================================================= */

export function colIndex(f: DataFrame, name: string): number {
  const i = f.columns.findIndex((c) => c.name === name);
  if (i < 0) throw new Error(`Column not found: ${name}`);
  return i;
}

export function colNames(f: DataFrame): string[] {
  return f.columns.map((c) => c.name);
}

/** All values of a column, in row order. */
export function col(f: DataFrame, name: string): CellValue[] {
  const c = colIndex(f, name);
  return f.data.map((row) => row[c]);
}

/** Column values coerced to numbers, skipping nulls. */
export function nums(f: DataFrame, name: string): number[] {
  return col(f, name).filter((v): v is number => typeof v === "number");
}

export function shapeOf(f: DataFrame): string {
  const r = f.data.length;
  const c = f.columns.length;
  return `${r} row${r === 1 ? "" : "s"} × ${c} column${c === 1 ? "" : "s"}`;
}

export function isStringCol(c: Column): boolean {
  return c.dtype === "object" || c.dtype === "category";
}

export function formatCell(v: CellValue, dtype: Dtype): string {
  if (v === null || v === undefined) return "NaN";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "NaN";
    if (dtype === "float64" || !Number.isInteger(v)) {
      const rounded = Math.round(v * 100) / 100;
      // Keep one trailing .0 so float columns read as floats, like pandas does.
      return Number.isInteger(rounded) ? rounded.toFixed(1) : rounded.toString();
    }
    return String(v);
  }
  if (typeof v === "boolean") return v ? "True" : "False";
  return String(v);
}

/* =======================================================================
   Operations — enough of pandas to compute lesson results instead of
   hand-typing them (hand-typed numbers drift when examples change).
   ======================================================================= */

/** Take rows by positional index, in the order given. */
export function takeRows(f: DataFrame, rowIdxs: number[]): DataFrame {
  return {
    ...f,
    columns: f.columns.map((c) => ({ ...c })),
    index: rowIdxs.map((i) => f.index[i]),
    data: rowIdxs.map((i) => [...f.data[i]]),
  };
}

/** Take columns by name, in the order given. */
export function takeCols(f: DataFrame, names: string[]): DataFrame {
  const idxs = names.map((n) => colIndex(f, n));
  return {
    ...f,
    columns: idxs.map((i) => ({ ...f.columns[i] })),
    index: [...f.index],
    data: f.data.map((row) => idxs.map((i) => row[i])),
  };
}

export function dropCols(f: DataFrame, names: string[]): DataFrame {
  return takeCols(
    f,
    colNames(f).filter((n) => !names.includes(n)),
  );
}

/** Append (or replace) a column. */
export function assign(
  f: DataFrame,
  name: string,
  values: CellValue[],
  dtype?: Dtype,
): DataFrame {
  const out = cloneFrame(f);
  const existing = out.columns.findIndex((c) => c.name === name);
  const column: Column = { name, dtype: dtype ?? inferDtype(values) };
  if (existing >= 0) {
    out.columns[existing] = column;
    out.data.forEach((row, r) => (row[existing] = values[r] ?? null));
  } else {
    out.columns.push(column);
    out.data.forEach((row, r) => row.push(values[r] ?? null));
  }
  return out;
}

export function renameCols(
  f: DataFrame,
  mapping: Record<string, string>,
): DataFrame {
  const out = cloneFrame(f);
  out.columns = out.columns.map((c) => ({ ...c, name: mapping[c.name] ?? c.name }));
  return out;
}

/** Positional order that sorts the frame by `keys`. Stable, like pandas. */
export function argsortBy(
  f: DataFrame,
  keys: string[],
  ascending: boolean[] | boolean = true,
): number[] {
  const asc = Array.isArray(ascending)
    ? ascending
    : keys.map(() => ascending);
  const idxs = f.data.map((_, i) => i);
  const cIdx = keys.map((k) => colIndex(f, k));
  return idxs.sort((a, b) => {
    for (let k = 0; k < cIdx.length; k++) {
      const va = f.data[a][cIdx[k]];
      const vb = f.data[b][cIdx[k]];
      const cmp = compareValues(va, vb);
      if (cmp !== 0) return asc[k] ? cmp : -cmp;
    }
    return a - b; // stable tie-break preserves original order
  });
}

export function sortValues(
  f: DataFrame,
  keys: string | string[],
  ascending: boolean[] | boolean = true,
): DataFrame {
  const ks = Array.isArray(keys) ? keys : [keys];
  return takeRows(f, argsortBy(f, ks, ascending));
}

/** sort_index(): order rows by their label rather than their contents. */
export function sortIndex(f: DataFrame, ascending = true): DataFrame {
  const order = f.index
    .map((label, i) => ({ label, i }))
    .sort((a, b) => {
      const cmp = compareValues(
        a.label as CellValue,
        b.label as CellValue,
      );
      return ascending ? cmp : -cmp;
    })
    .map((e) => e.i);
  return takeRows(f, order);
}

export function compareValues(a: CellValue, b: CellValue): number {
  // NaN sorts last in pandas regardless of direction.
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

/** Positional indices of rows where `pred` holds. */
export function whereRows(
  f: DataFrame,
  pred: (row: Record<string, CellValue>, i: number) => boolean,
): number[] {
  return f.data.map((_, i) => i).filter((i) => pred(rowObject(f, i), i));
}

export function rowObject(f: DataFrame, i: number): Record<string, CellValue> {
  const o: Record<string, CellValue> = {};
  f.columns.forEach((c, j) => (o[c.name] = f.data[i][j]));
  return o;
}

export function resetIndex(f: DataFrame): DataFrame {
  return { ...cloneFrame(f), index: f.data.map((_, i) => i), indexName: undefined };
}

export function setIndex(f: DataFrame, name: string): DataFrame {
  const c = colIndex(f, name);
  const out = dropCols(f, [name]);
  out.index = f.data.map((row) => row[c] as number | string);
  out.indexName = name;
  return out;
}

/** Group row positions by the values of one column, preserving first-seen order. */
export function groupRows(f: DataFrame, key: string): Map<string, number[]> {
  const c = colIndex(f, key);
  const groups = new Map<string, number[]>();
  f.data.forEach((row, i) => {
    const k = String(row[c]);
    const bucket = groups.get(k);
    if (bucket) bucket.push(i);
    else groups.set(k, [i]);
  });
  // pandas sorts group keys by default (sort=True)
  return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })));
}

export type AggName = "mean" | "sum" | "count" | "min" | "max" | "median" | "std" | "nunique" | "first";

export function aggregate(values: CellValue[], how: AggName): CellValue {
  const numeric = values.filter((v): v is number => typeof v === "number");
  switch (how) {
    case "count":
      return values.filter((v) => v !== null && v !== undefined).length;
    case "nunique":
      return new Set(values.filter((v) => v !== null).map(String)).size;
    case "first":
      return values[0] ?? null;
    case "sum":
      return numeric.reduce((a, b) => a + b, 0);
    case "mean":
      return numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;
    case "median": {
      if (!numeric.length) return null;
      const s = [...numeric].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    case "min":
      return numeric.length ? Math.min(...numeric) : null;
    case "max":
      return numeric.length ? Math.max(...numeric) : null;
    case "std": {
      if (numeric.length < 2) return null;
      const mu = numeric.reduce((a, b) => a + b, 0) / numeric.length;
      const variance =
        numeric.reduce((a, b) => a + (b - mu) ** 2, 0) / (numeric.length - 1);
      return Math.sqrt(variance);
    }
  }
}

/** `df.groupby(key)[value].how()` as a one-column frame indexed by group key. */
export function groupAgg(
  f: DataFrame,
  key: string,
  value: string,
  how: AggName,
  outName = value,
): DataFrame {
  const groups = groupRows(f, key);
  const vIdx = colIndex(f, value);
  const index: (string | number)[] = [];
  const out: CellValue[] = [];
  groups.forEach((idxs, k) => {
    index.push(k);
    out.push(aggregate(idxs.map((i) => f.data[i][vIdx]), how));
  });
  return series(outName, out, { index, indexName: key });
}

/** value_counts(): descending by count, like pandas. */
export function valueCounts(f: DataFrame, name: string): DataFrame {
  const counts = new Map<string, number>();
  for (const v of col(f, name)) {
    if (v === null) continue;
    const k = String(v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return series(
    "count",
    entries.map((e) => e[1]),
    { index: entries.map((e) => e[0]), indexName: name },
  );
}

export function cumulative(values: CellValue[], how: "sum" | "max"): CellValue[] {
  let acc: number | null = null;
  return values.map((v) => {
    if (typeof v !== "number") return null;
    acc = acc === null ? v : how === "sum" ? acc + v : Math.max(acc, v);
    return acc;
  });
}

/** Rolling window aggregate; the first `window - 1` slots are NaN, as in pandas. */
export function rolling(
  values: CellValue[],
  window: number,
  how: AggName = "mean",
): CellValue[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    return aggregate(values.slice(i - window + 1, i + 1), how);
  });
}

export function shiftValues(values: CellValue[], by = 1): CellValue[] {
  return values.map((_, i) => {
    const src = i - by;
    return src >= 0 && src < values.length ? values[src] : null;
  });
}

export function diffValues(values: CellValue[], by = 1): CellValue[] {
  const prev = shiftValues(values, by);
  return values.map((v, i) =>
    typeof v === "number" && typeof prev[i] === "number"
      ? v - (prev[i] as number)
      : null,
  );
}

/* =======================================================================
   Highlight helpers
   ======================================================================= */

/** Small helper for building highlight keys. */
export const hk = (r: number | "*", c: number | "*") => `${r}:${c}`;

type Kind = HighlightMap[string];

export function hlRows(rowIdxs: number[], kind: Kind): HighlightMap {
  const h: HighlightMap = {};
  for (const r of rowIdxs) h[`${r}:*`] = kind;
  return h;
}

export function hlCols(colIdxs: number[], kind: Kind): HighlightMap {
  const h: HighlightMap = {};
  for (const c of colIdxs) h[`*:${c}`] = kind;
  return h;
}

export function hlCells(cells: Array<[number, number]>, kind: Kind): HighlightMap {
  const h: HighlightMap = {};
  for (const [r, c] of cells) h[`${r}:${c}`] = kind;
  return h;
}

/** Highlight one column of a frame by name. */
export function hlCol(f: DataFrame, name: string, kind: Kind): HighlightMap {
  return hlCols([colIndex(f, name)], kind);
}

/**
 * Later maps win — so you can layer a cell highlight over a row highlight.
 * Cell keys beat row/column wildcards in <DataFrameView /> regardless.
 */
export function hlMerge(...maps: Array<HighlightMap | undefined>): HighlightMap {
  return Object.assign({}, ...maps.filter(Boolean)) as HighlightMap;
}

/** Colour every row of a frame by which group its key value falls into. */
export function hlByGroup(
  f: DataFrame,
  key: string,
  palette: Kind[] = ["group-a", "group-b", "group-c", "group-d", "group-e"],
): HighlightMap {
  const groups = [...groupRows(f, key).keys()];
  const h: HighlightMap = {};
  const c = colIndex(f, key);
  f.data.forEach((row, r) => {
    const gi = groups.indexOf(String(row[c]));
    h[`${r}:*`] = palette[gi % palette.length];
  });
  return h;
}

/** Bucket a numeric column into the five heat shades. */
export function hlHeat(f: DataFrame, name: string): HighlightMap {
  const c = colIndex(f, name);
  const values = nums(f, name);
  if (!values.length) return {};
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const h: HighlightMap = {};
  f.data.forEach((row, r) => {
    const v = row[c];
    if (typeof v !== "number") return;
    const bucket = Math.min(4, Math.floor(((v - lo) / span) * 5));
    h[`${r}:${c}`] = `heat-${bucket}` as Kind;
  });
  return h;
}
