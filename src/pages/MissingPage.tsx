import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS_WITH_NA } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  hlCells,
  rows,
  takeRows,
  whereRows,
} from "@/lib/dataframe";
import type { CellValue, Step } from "@/types";

const L = listing(`df.isna()                       # True where a value is missing
df.isna().sum()                 # the standard per-column report

df[df["score"] == np.nan]       # 0 rows — NaN is never equal to itself
df[df["score"].isna()]          # this is how you find them

df.fillna(0)                            # blunt
df.fillna({"score": df["score"].mean()})  # per column
df["score"].ffill()                     # carry the last value forward

df.dropna()                     # drop any row with a NaN anywhere
df.dropna(subset=["score"])     # only care about one column`);

const F = STUDENTS_WITH_NA;
const NA_CELLS: Array<[number, number]> = [];
F.data.forEach((row, r) =>
  row.forEach((v, c) => {
    if (v === null) NA_CELLS.push([r, c]);
  }),
);

/** isna() returns a frame of booleans with the same shape. */
const ISNA = rows({
  columns: F.columns.map((c) => c.name),
  data: F.data.map((row) => row.map((v) => v === null)),
  dtypes: Object.fromEntries(F.columns.map((c) => [c.name, "bool" as const])),
});

const SCORE_MEAN = 82;
const ATTEMPT_MEAN = 1.8;

const fillZero = (() => {
  let out = F;
  for (const c of F.columns) {
    const filled = (col(F, c.name) as CellValue[]).map((v) =>
      v === null ? (c.name === "batch" ? "0" : 0) : v,
    );
    out = assign(out, c.name, filled, c.name === "batch" ? "object" : "int64");
  }
  return out;
})();

const fillMean = (() => {
  let out = assign(
    F,
    "score",
    (col(F, "score") as CellValue[]).map((v) => (v === null ? SCORE_MEAN : v)),
    "float64",
  );
  out = assign(
    out,
    "attempts",
    (col(F, "attempts") as CellValue[]).map((v) =>
      v === null ? ATTEMPT_MEAN : v,
    ),
    "float64",
  );
  return out;
})();

const ffilled = assign(
  F,
  "score",
  (() => {
    let last: CellValue = null;
    return (col(F, "score") as CellValue[]).map((v) => {
      if (v !== null) last = v;
      return v === null ? last : v;
    });
  })(),
  "float64",
);

export function MissingPage() {
  const completeRows = whereRows(F, (r) =>
    Object.values(r).every((v) => v !== null),
  );
  const hasScore = whereRows(F, (r) => r.score !== null);

  const steps: Step[] = [
    {
      id: "look",
      label: "Where are the holes?",
      code: "df",
      lines: L.at("df.isna()  "),
      views: [
        {
          frame: F,
          title: "df",
          dtypes: true,
          highlights: hlCells(NA_CELLS, "null"),
          note: "Four gaps. And look at the dtype row: score and attempts are float64, not int64 — because NaN is a float, and an integer array cannot store one.",
        },
      ],
      explain:
        "pandas prints missing values as NaN. The dtype consequence is the subtle part: a single missing value promotes a whole integer column to float, which is why your counts come back as 3.0 instead of 3.",
      outputs: [
        { label: "missing cells", value: "4", tone: "warning" },
        { label: "score dtype", value: "float64" },
      ],
    },
    {
      id: "isna",
      label: "isna() · a map of the gaps",
      code: "df.isna()",
      lines: L.at("df.isna()  "),
      views: [
        {
          frame: ISNA,
          title: "df.isna()",
          highlights: hlCells(NA_CELLS, "mask-true"),
          badge: "same shape, all booleans",
          note: "True exactly where a value is missing. notna() is the same map inverted.",
        },
      ],
      explain:
        "isna() turns the question into data you can compute with. Because True is 1, summing it counts — which is where the standard missing-value report comes from.",
    },
    {
      id: "count",
      label: "isna().sum() · the report",
      code: "df.isna().sum()",
      lines: L.at("df.isna().sum()"),
      views: [
        {
          frame: ISNA,
          title: "df.isna()",
          muted: true,
          highlights: hlCells(NA_CELLS, "mask-true"),
        },
      ],
      outputs: [
        { label: "name", value: "0", tone: "success" },
        { label: "batch", value: "1", tone: "warning" },
        { label: "score", value: "2", tone: "danger" },
        { label: "attempts", value: "1", tone: "warning" },
      ],
      explain:
        "Run this on every dataset you load. Summing down the columns gives the count per column; df.isna().sum().sum() gives the total, and df.isna().any(axis=1).sum() counts affected rows.",
    },
    {
      id: "trap",
      label: "NaN is not equal to itself",
      code: 'df[df["score"] == np.nan]',
      lines: L.at('df[df["score"] == np.nan]'),
      views: [
        {
          frame: takeRows(F, []),
          title: 'df[df["score"] == np.nan]',
          badge: "0 rows",
          note: "Empty. No error, no warning — just nothing, which is far more dangerous than a crash.",
        },
      ],
      stdout: `>>> float("nan") == float("nan")
False`,
      explain:
        "NaN comes from the IEEE floating-point standard, where it is defined as not equal to anything, including itself. So == can never find it. isna() is the only test that works, and the same applies to != and to .isin([np.nan]).",
    },
    {
      id: "isna-filter",
      label: "Finding them properly",
      code: 'df[df["score"].isna()]',
      lines: L.at('df[df["score"].isna()]'),
      views: [
        {
          frame: takeRows(
            F,
            whereRows(F, (r) => r.score === null),
          ),
          title: 'df[df["score"].isna()]',
          highlights: { "*:2": "null" },
          badge: "2 rows",
          note: "Priya and Kabir. Worth looking at these rows before you decide how to fill them — the pattern of missingness is often informative.",
        },
      ],
      explain:
        "Inspect before you impute. If the missing scores all belong to one batch, or to students who never sat the test, then filling them with the mean invents data and biases every number downstream.",
    },
    {
      id: "fill-zero",
      label: "fillna(0) · the blunt option",
      code: "df.fillna(0)",
      lines: L.at("df.fillna(0)"),
      views: [
        {
          frame: fillZero,
          title: "df.fillna(0)",
          highlights: hlCells(NA_CELLS, "changed"),
          badge: "every gap → 0",
          note: 'Convenient, and usually wrong. A score of 0 is a real, terrible mark — it drags the mean from 82 down to 54.7.',
        },
      ],
      explain:
        "fillna(0) is right when zero is the true meaning of absence — no purchases, no clicks, no refunds. It is wrong whenever the value simply was not recorded, because you have replaced 'unknown' with a specific, false claim.",
      outputs: [
        { label: "mean before", value: "82.0" },
        { label: "mean after", value: "54.7", tone: "danger" },
      ],
    },
    {
      id: "fill-mean",
      label: "fillna per column",
      code: 'df.fillna({"score": df["score"].mean()})',
      lines: L.at('df.fillna({"score"'),
      views: [
        {
          frame: fillMean,
          title: "df.fillna({…})",
          highlights: hlCells(NA_CELLS, "new"),
          badge: "mean-filled",
          note: "score gaps became 82.0 (the mean of the four real scores) and attempts became 1.8. The column mean is unchanged by construction.",
        },
      ],
      explain:
        "A dict lets you choose a strategy per column — mean for a continuous measure, the mode for a category, a sentinel like 'unknown' for text. Mean-filling keeps the average honest but shrinks the variance, so note it before any statistical test.",
      variables: [
        { name: "score.mean()", type: "float", preview: "82.0" },
        { name: "attempts.mean()", type: "float", preview: "1.8" },
      ],
    },
    {
      id: "ffill",
      label: "ffill · carry forward",
      code: 'df["score"].ffill()',
      lines: L.at('df["score"].ffill()'),
      views: [
        {
          frame: ffilled,
          title: 'df["score"].ffill()',
          highlights: hlCells(
            [
              [1, 2],
              [4, 2],
            ],
            "changed",
          ),
          badge: "last valid value",
          note: "Priya inherits Aarav's 91 and Kabir inherits Diya's 95 — purely because of where they sit in the file.",
        },
      ],
      explain:
        "ffill is the right answer for time series, where the last known reading genuinely is the best estimate of the current one — a sensor, a price, a running balance. On unordered rows like these it is nonsense, which is exactly why it is worth seeing done wrong once.",
    },
    {
      id: "dropna",
      label: "dropna() · remove the rows",
      code: "df.dropna()",
      lines: L.at("df.dropna()  "),
      views: [
        {
          frame: F,
          title: "df",
          muted: true,
          highlights: hlCells(NA_CELLS, "drop"),
        },
        {
          frame: takeRows(F, completeRows),
          title: "df.dropna()",
          arrow: "any NaN → the whole row goes",
          badge: `${completeRows.length} of 6 rows`,
          note: "Four rows deleted over four missing cells. That is 67% of the data thrown away to patch 17% of the cells.",
        },
      ],
      explain:
        "dropna() is how small amounts of scattered missingness destroy a dataset: each hole costs you an entire row. Always print the shape before and after — and if the loss is this severe, impute instead.",
      outputs: [
        { label: "rows lost", value: "4 of 6", tone: "danger" },
        { label: "cells missing", value: "4 of 24" },
      ],
    },
    {
      id: "subset",
      label: "dropna(subset=…) · be specific",
      code: 'df.dropna(subset=["score"])',
      lines: L.at('df.dropna(subset=["score"])'),
      views: [
        {
          frame: takeRows(F, hasScore),
          title: 'df.dropna(subset=["score"])',
          badge: `${hasScore.length} of 6 rows`,
          highlights: hlCells(
            [[2, 3]],
            "null",
          ),
          note: "Only a missing score disqualifies a row now. Ishaan stays despite his missing attempts value — it was not in the subset.",
        },
      ],
      explain:
        "This is nearly always what you meant. State which columns your analysis actually requires and let the rest stay missing. You keep four rows instead of two, and no row is dropped for a reason that does not matter.",
    },
  ];

  return (
    <PageShell meta={PAGES.missing}>
      <StepRunner runId="missing" code={L.code} steps={steps} />
    </PageShell>
  );
}
