import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { SALES_DAILY } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  cumulative,
  diffValues,
  hlCells,
  rolling,
  shiftValues,
} from "@/lib/dataframe";
import type { CellValue, Step } from "@/types";

const L = listing(`df["prev"]   = df["units"].shift(1)      # yesterday's value, on today's row
df["delta"]  = df["units"].diff()        # units - prev
df["growth"] = df["units"].pct_change()  # relative change

df["running"] = df["units"].cumsum()     # running total
df["ma3"]     = df["units"].rolling(3).mean()   # 3-day moving average

df["ma3"] = df["units"].rolling(3, min_periods=1).mean()

# Grouped data: restart the window per group
df["prev"] = df.groupby("region")["units"].shift(1)`);

const F = SALES_DAILY;
const units = col(F, "units") as number[];

const prev = shiftValues(units, 1);
const delta = diffValues(units, 1);
const growth = units.map((u, i) =>
  i === 0 ? null : Math.round(((u - units[i - 1]) / units[i - 1]) * 100) / 100,
);
const running = cumulative(units, "sum");
const ma3 = rolling(units, 3, "mean");

const withPrev = assign(F, "prev", prev as CellValue[], "float64");
const withDelta = assign(withPrev, "delta", delta as CellValue[], "float64");
const withGrowth = assign(withDelta, "growth", growth as CellValue[], "float64");
const withRunning = assign(F, "running", running as CellValue[], "int64");
const withMa3 = assign(withRunning, "ma3", ma3 as CellValue[], "float64");

/** min_periods=1 fills the warm-up rows with a partial window instead of NaN. */
const partial = units.map((_, i) => {
  const w = units.slice(Math.max(0, i - 2), i + 1);
  return Math.round((w.reduce((a, b) => a + b, 0) / w.length) * 100) / 100;
});
const withPartial = assign(withRunning, "ma3", partial, "float64");

export function WindowPage() {
  const steps: Step[] = [
    {
      id: "shift",
      label: "shift · bring the past forward",
      code: 'df["units"].shift(1)',
      lines: L.at('shift(1)'),
      views: [
        {
          frame: withPrev,
          title: 'df["prev"] = units.shift(1)',
          highlights: {
            ...hlCells([[0, 2]], "null"),
            ...hlCells([[1, 2], [2, 2], [3, 2], [4, 2], [5, 2]], "new"),
          },
          badge: "everything slid down one row",
          note: "Row 1 now carries row 0's value: 12. The top row has nothing above it, so it is NaN — and the column is float64 for exactly that reason.",
        },
      ],
      explain:
        "shift is the whole trick behind window functions: it puts a neighbour's value on the current row, so plain column arithmetic can compare the two. shift(-1) looks forward instead.",
      variables: [
        { name: "units", type: "Series", preview: "12,18,9,21,25,16" },
        { name: "prev", type: "Series", preview: "NaN,12,18,9,21,25" },
      ],
    },
    {
      id: "diff",
      label: "diff · the change",
      code: 'df["units"].diff()',
      lines: L.at("diff()"),
      views: [
        {
          frame: withDelta,
          title: 'df["delta"] = units.diff()',
          highlights: {
            ...hlCells([[0, 3]], "null"),
            ...hlCells([[1, 3], [3, 3], [4, 3]], "new"),
            ...hlCells([[2, 3], [5, 3]], "changed"),
          },
          badge: "units − prev",
          note: "18 − 12 = +6, then 9 − 18 = −9, then +12, +4, −9. Exactly the units column minus the prev column.",
        },
      ],
      explain:
        "diff() is literally s - s.shift(1), which is why its first value is always NaN. Two consecutive diffs give you acceleration; diff(7) compares against the same weekday last week.",
    },
    {
      id: "pct",
      label: "pct_change · relative change",
      code: 'df["units"].pct_change()',
      lines: L.at("pct_change()"),
      views: [
        {
          frame: withGrowth,
          title: 'df["growth"]',
          highlights: {
            ...hlCells([[0, 4]], "null"),
            ...hlCells([[1, 4], [3, 4], [4, 4]], "new"),
            ...hlCells([[2, 4], [5, 4]], "changed"),
          },
          badge: "as a fraction",
          note: "0.5 means +50% (12 → 18). −0.5 means a halving (18 → 9). Multiply by 100 yourself if you want percentage points.",
        },
      ],
      explain:
        "The same comparison expressed proportionally, which is usually the honest one: +6 units means nothing until you know whether the base was 12 or 12,000. Beware a zero in the denominator — it yields inf, not NaN.",
    },
    {
      id: "cumsum",
      label: "cumsum · running total",
      code: 'df["units"].cumsum()',
      lines: L.at("cumsum()"),
      views: [
        {
          frame: withRunning,
          title: 'df["running"] = units.cumsum()',
          highlights: { "*:2": "new" },
          badge: "accumulating down the column",
          note: "12, then 12+18=30, then +9=39, +21=60, +25=85, +16=101. The last value equals units.sum().",
        },
      ],
      explain:
        "No NaN here: the first cumulative value is just the first value. cummax, cummin and cumprod work the same way — handy for running peaks, drawdowns and compounding.",
      outputs: [
        { label: "final running", value: "101" },
        { label: "units.sum()", value: "101", tone: "success" },
      ],
    },
    {
      id: "rolling",
      label: "rolling(3).mean() · smoothing",
      code: 'df["units"].rolling(3).mean()',
      lines: L.at("rolling(3).mean()"),
      views: [
        {
          frame: withMa3,
          title: 'df["ma3"]',
          highlights: {
            ...hlCells([[0, 3], [1, 3]], "null"),
            ...hlCells([[2, 3], [3, 3], [4, 3], [5, 3]], "new"),
          },
          badge: "3-row sliding window",
          note: "Row 2 is the first full window: (12+18+9)/3 = 13.0. Then (18+9+21)/3 = 16.0, (9+21+25)/3 = 18.33, (21+25+16)/3 = 20.67.",
        },
      ],
      explain:
        "A moving average trades responsiveness for noise. The two NaN at the top are the warm-up: rows 0 and 1 cannot fill a 3-wide window, and pandas refuses to pretend otherwise.",
      outputs: [
        { label: "window", value: "3 rows" },
        { label: "warm-up NaN", value: "2", tone: "warning" },
      ],
    },
    {
      id: "minperiods",
      label: "min_periods · fill the warm-up",
      code: 'rolling(3, min_periods=1).mean()',
      lines: L.at("min_periods=1"),
      views: [
        {
          frame: withPartial,
          title: "min_periods=1",
          highlights: hlCells([[0, 3], [1, 3]], "changed"),
          badge: "partial windows allowed",
          note: "Row 0 is now just 12.0 (a window of one) and row 1 is (12+18)/2 = 15.0. The rest is unchanged.",
        },
      ],
      explain:
        "min_periods says how much data a window needs before it will report a number. Set it to 1 and you lose no rows — but the first few values are computed from less data, so they are noisier than they look. Worth knowing you made that trade.",
    },
    {
      id: "grouped",
      label: "Windows inside groups",
      code: 'df.groupby("region")["units"].shift(1)',
      lines: L.at('df.groupby("region")["units"].shift(1)'),
      views: [
        {
          frame: withPrev,
          title: "the trap",
          muted: true,
          highlights: hlCells([[3, 2]], "drop"),
          note: "If rows 0–2 were the North region and rows 3–5 were South, then South's first row would have silently inherited North's last value.",
        },
      ],
      explain:
        "shift and rolling follow row order and know nothing about groups, so at every group boundary they leak values across. Route them through groupby and each group's window restarts — the same fix applies to diff, cumsum and pct_change.",
      outputs: [
        { label: 'units.shift(1)', value: "leaks", tone: "danger" },
        { label: 'groupby(...).shift(1)', value: "per group", tone: "success" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.window}>
      <StepRunner runId="window" code={L.code} steps={steps} />
    </PageShell>
  );
}
