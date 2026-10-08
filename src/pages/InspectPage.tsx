import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import { hlRows, rows, takeRows } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.head(3)      # first 3 rows
df.tail(2)      # last 2 rows
df.shape        # (rows, columns)
df.info()       # schema + missing-value audit
df.describe()   # numeric summary statistics
df.nunique()    # distinct values per column
df.sample(2, random_state=42)   # random rows`);

/** describe() values, computed by hand so the lesson can be checked. */
const DESCRIBE = rows({
  columns: ["score", "attempts"],
  index: ["count", "mean", "std", "min", "25%", "50%", "75%", "max"],
  data: [
    [6, 6],
    [83, 2],
    [10.39, 0.89],
    [68, 1],
    [76, 1.25],
    [85, 2],
    [90.25, 2.75],
    [95, 3],
  ],
  dtypes: { score: "float64", attempts: "float64" },
});

const INFO = `<class 'pandas.core.frame.DataFrame'>
RangeIndex: 6 entries, 0 to 5
Data columns (total 5 columns):
 #   Column    Non-Null Count  Dtype
---  ------    --------------  -----
 0   name      6 non-null      object
 1   batch     6 non-null      object
 2   score     6 non-null      int64
 3   attempts  6 non-null      int64
 4   passed    6 non-null      bool
dtypes: bool(1), int64(2), object(2)
memory usage: 350.0+ bytes`;

export function InspectPage() {
  const steps: Step[] = [
    {
      id: "head",
      label: "head(3)",
      code: "df.head(3)",
      lines: L.at("df.head(3)"),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          muted: true,
          highlights: hlRows([0, 1, 2], "match"),
        },
        {
          frame: takeRows(STUDENTS, [0, 1, 2]),
          title: "df.head(3)",
          arrow: "take the top",
          badge: "3 rows",
          note: "head() defaults to 5. It is a cheap peek — pandas does not read or copy the rest of the frame to answer it.",
        },
      ],
      explain:
        "Always the first command. It confirms the file parsed, the columns are named what you expected, and the values look like values rather than headers.",
    },
    {
      id: "tail",
      label: "tail(2)",
      code: "df.tail(2)",
      lines: L.at("df.tail(2)"),
      views: [
        {
          frame: takeRows(STUDENTS, [4, 5]),
          title: "df.tail(2)",
          badge: "last 2 rows",
          note: "The index labels are 4 and 5 — proof that tail keeps the original labels rather than renumbering.",
        },
      ],
      explain:
        "tail is how you catch files with a trailing total row, a footer, or a truncated last line. Worth a look on anything you did not generate yourself.",
    },
    {
      id: "shape",
      label: "shape",
      code: "df.shape",
      lines: L.at("df.shape"),
      views: [{ frame: STUDENTS, title: "df" }],
      outputs: [
        { label: "df.shape", value: "(6, 5)" },
        { label: "len(df)", value: "6" },
        { label: "df.size", value: "30" },
      ],
      explain:
        "shape is (rows, columns) — rows first. len(df) gives just the row count. Check shape before and after every merge and filter; a surprising number means something went wrong.",
    },
    {
      id: "info",
      label: "info() — the audit",
      code: "df.info()",
      lines: L.at("df.info()"),
      views: [{ frame: STUDENTS, title: "df", dtypes: true, muted: true }],
      stdout: INFO,
      explain:
        "The single most useful command on a new dataset. Read the Non-Null Count column against the 6 entries on line two: every column here is complete. A smaller number means missing values.",
      variables: [
        { name: "entries", type: "int", preview: "6" },
        { name: "memory", type: "str", preview: "350 bytes" },
      ],
    },
    {
      id: "describe",
      label: "describe() — the distribution",
      code: "df.describe()",
      lines: L.at("df.describe()"),
      views: [
        {
          frame: DESCRIBE,
          title: "df.describe()",
          badge: "numeric columns only",
          note: "name, batch and passed are absent: describe() skips non-numeric columns unless you pass include='all'.",
        },
      ],
      outputs: [
        { label: "mean score", value: "83.0" },
        { label: "spread (std)", value: "10.39" },
        { label: "range", value: "68 → 95" },
      ],
      explain:
        "Eight statistics per numeric column. Compare mean against 50% to spot skew, and min/max against what is physically possible to spot bad data — a negative score, an age of 300.",
    },
    {
      id: "nunique",
      label: "nunique() — the cardinality",
      code: "df.nunique()",
      lines: L.at("df.nunique()"),
      views: [{ frame: STUDENTS, title: "df" }],
      outputs: [
        { label: "name", value: "6" },
        { label: "batch", value: "2" },
        { label: "score", value: "6" },
        { label: "passed", value: "2" },
      ],
      explain:
        "Cardinality tells you what each column is for. 6 of 6 distinct means it is an identifier; 2 of 6 means it is a category worth grouping by. This is how you find your group keys.",
    },
    {
      id: "sample",
      label: "sample() — an honest peek",
      code: "df.sample(2, random_state=42)",
      lines: L.at("df.sample(2"),
      views: [
        {
          frame: takeRows(STUDENTS, [1, 4]),
          title: "df.sample(2, random_state=42)",
          highlights: hlRows([0, 1], "match"),
          note: "random_state fixes the draw so the same rows come back every run — essential when you are sharing a notebook.",
        },
      ],
      explain:
        "Files often arrive sorted, which makes head() unrepresentative — you see only the alphabetically first rows. sample() draws from the whole frame instead.",
    },
  ];

  return (
    <PageShell meta={PAGES.inspect}>
      <StepRunner runId="inspect" code={L.code} steps={steps} />
    </PageShell>
  );
}
