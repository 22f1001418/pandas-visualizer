import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS, STUDENTS_AS_TEXT } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  hlCol,
  rows,
  series,
  sortValues,
  takeCols,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.dtypes                 # score is "object" — it is text!

df.sort_values("score")   # sorts like a dictionary, not like numbers

df["score"].astype("int64")                    # ValueError on "n/a"
df["score"] = pd.to_numeric(df["score"], errors="coerce")

df["joined"] = pd.to_datetime(df["joined"])    # object -> datetime64[ns]
students["batch"] = students["batch"].astype("category")

df.memory_usage(deep=True)`);

const TEXT = STUDENTS_AS_TEXT;

/** to_numeric(errors="coerce"): "n/a" becomes NaN, so the column is float64. */
const COERCED = assign(
  TEXT,
  "score",
  [91, 88, 74, null],
  "float64",
);

const PARSED = assign(
  COERCED,
  "joined",
  col(COERCED, "joined"),
  "datetime64",
);

const BATCH = series("batch", col(STUDENTS, "batch"), { dtype: "object" });
const BATCH_CAT = series("batch", col(STUDENTS, "batch"), { dtype: "category" });

const MEMORY = rows({
  columns: ["bytes"],
  index: ["object", "category"],
  data: [[372], [292]],
});

export function DtypesPage() {
  const steps: Step[] = [
    {
      id: "look",
      label: "Numbers that are not numbers",
      code: "df.dtypes",
      lines: L.at("df.dtypes"),
      views: [
        {
          frame: TEXT,
          title: "df",
          dtypes: true,
          highlights: hlCol(TEXT, "score", "null"),
          note: 'Look at the dtype row: score is object, not int64. One unparseable value — "n/a" — was enough to make the entire column text.',
        },
      ],
      explain:
        "This frame came from a CSV where one score was recorded as 'n/a'. read_csv could not fit that into an integer array, so it fell back to object dtype and stored all four values as Python strings.",
      variables: [
        { name: "df.score.dtype", type: "dtype", preview: "object" },
      ],
    },
    {
      id: "trap",
      label: "Why that matters",
      code: 'df.sort_values("score")',
      lines: L.at('df.sort_values("score")'),
      views: [
        {
          frame: sortValues(takeCols(TEXT, ["name", "score"]), "score"),
          title: 'df.sort_values("score")',
          highlights: hlCol(TEXT, "score", "drop"),
          badge: "sorted — wrongly",
          note: 'Text sorts character by character: "74" before "88" before "91" before "n/a". Here that looks plausible. Add a score of 100 and it sorts first, because "1" < "7".',
        },
      ],
      explain:
        "Strings compare lexicographically. Sorts, comparisons and > filters all silently give wrong answers on a text column of numbers — no error, no warning. This is the most expensive dtype bug there is.",
      outputs: [
        { label: "'100' > '99'", value: "False", tone: "danger" },
        { label: "100 > 99", value: "True", tone: "success" },
      ],
    },
    {
      id: "astype",
      label: "astype() is strict",
      code: 'df["score"].astype("int64")',
      lines: L.at('astype("int64")'),
      views: [{ frame: TEXT, title: "df", muted: true, dtypes: true }],
      stdout: `ValueError: invalid literal for int() with base 10: 'n/a'`,
      explain:
        "astype demands that every value convert. One bad entry and the whole call fails. That is the right default — it refuses to guess — but it means astype alone cannot clean real data.",
    },
    {
      id: "coerce",
      label: "to_numeric(errors='coerce')",
      code: 'pd.to_numeric(df["score"], errors="coerce")',
      lines: L.at('errors="coerce"'),
      views: [
        {
          frame: COERCED,
          title: "df",
          dtypes: true,
          highlights: hlCol(COERCED, "score", "new"),
          note: 'Numbers parsed, "n/a" became NaN — and the dtype is float64, not int64, because an integer array cannot hold NaN.',
        },
      ],
      explain:
        "errors='coerce' converts what it can and marks the rest missing. Now the column is numeric, sorting is correct, and the one bad value is explicitly NaN rather than hiding as text.",
      outputs: [
        { label: "dtype", value: "float64", tone: "accent" },
        { label: "NaN count", value: "1", tone: "warning" },
      ],
      variables: [
        { name: "df.score.mean()", type: "float", preview: "84.33" },
      ],
    },
    {
      id: "dates",
      label: "to_datetime for dates",
      code: 'pd.to_datetime(df["joined"])',
      lines: L.at("pd.to_datetime"),
      views: [
        {
          frame: PARSED,
          title: "df",
          dtypes: true,
          highlights: hlCol(PARSED, "joined", "new"),
          note: "Same characters on screen, completely different dtype. Now you can subtract two dates, sort chronologically, or pull out .dt.month.",
        },
      ],
      explain:
        "Date strings are the other half of this problem. They look fine and even sort correctly in ISO format — but you cannot subtract them, and '2025-1-7' would sort after '2025-02-02'. Parse them once, at load.",
    },
    {
      id: "category",
      label: "category for repeated text",
      code: 'students["batch"].astype("category")',
      lines: L.at('astype("category")'),
      views: [
        { frame: BATCH, title: 'batch (object)', series: true, dtypes: true, muted: true },
        {
          frame: BATCH_CAT,
          title: 'batch.astype("category")',
          series: true,
          dtypes: true,
          arrow: "store each label once",
          note: 'Only two distinct values across six rows. As category, pandas keeps the labels once and stores 0/1 codes per row.',
        },
        {
          frame: MEMORY,
          title: "memory_usage(deep=True)",
          badge: "bytes",
          note: "A modest win on six rows; on a million rows with five distinct values it is a 10× difference.",
        },
      ],
      explain:
        "category is the right dtype for low-cardinality text: statuses, cities, plan names. It also makes groupby faster and lets you define an order, so 'low' < 'medium' < 'high' sorts properly.",
      outputs: [
        { label: "distinct values", value: "2" },
        { label: "memory saved", value: "~22%", tone: "success" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.dtypes}>
      <StepRunner runId="dtypes" code={L.code} steps={steps} />
    </PageShell>
  );
}
